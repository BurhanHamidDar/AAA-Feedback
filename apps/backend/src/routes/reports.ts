import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { supabase } from "../config/supabase";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { logger } from "../utils/logger";
import { hasSubmitterType } from "../utils/schema";
import path from "path";

const router: Router = Router();

router.use(requireAuth);

/**
 * Helper to build feedback query with parameters
 */
async function buildFilteredFeedbackQuery(queryParams: any, selectAll = false): Promise<any> {
  const {
    date_from,
    date_to,
    category,
    sentiment,
    priority,
    status,
    submission_type,
    submitter_type,
    class: studentClass,
    section: studentSection,
  } = queryParams;

  let selectClause = `created_at, status, category, sentiment, priority, resolved_at, submission_type, ${
    hasSubmitterType ? "submitter_type, " : ""
  }student_id, ai_processed, tracking_number, feedback_scope, submitter_relationship`;

  if (selectAll) {
    selectClause = `
      id, tracking_number, submission_type, raw_text, summary, category, sentiment, priority, status,
      ${hasSubmitterType ? "submitter_type, " : ""}submitter_name, submitter_phone, created_at, resolved_at, is_anonymous,
      feedback_scope, submitter_relationship,
      students(admission_no, student_name, class, section)
    `;
  }

  let query = supabase
    .from("feedback")
    .select(selectClause);

  if (date_from) query = query.gte("created_at", date_from);
  if (date_to) query = query.lte("created_at", date_to);

  if (category) {
    const categories = category.split(",").map((c: string) => c.trim()).filter(Boolean);
    if (categories.length > 0) query = query.in("category", categories);
  }
  if (sentiment) {
    const sentiments = sentiment.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (sentiments.length > 0) query = query.in("sentiment", sentiments);
  }
  if (priority) {
    const priorities = priority.split(",").map((p: string) => p.trim()).filter(Boolean);
    if (priorities.length > 0) query = query.in("priority", priorities);
  }
  if (status) {
    const statuses = status.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (statuses.length > 0) query = query.in("status", statuses);
  }
  if (submission_type) {
    const types = submission_type.split(",").map((t: string) => t.trim()).filter(Boolean);
    if (types.length > 0) query = query.in("submission_type", types);
  }

  if (submitter_type && hasSubmitterType) {
    const stypes = submitter_type.split(",").map((t: string) => t.trim()).filter(Boolean);
    if (stypes.length > 0) query = query.in("submitter_type", stypes);
  }

  // Filter by Class / Section
  if (studentClass || studentSection) {
    let studentQuery = supabase.from("students").select("id");
    if (studentClass) studentQuery = studentQuery.eq("class", studentClass);
    if (studentSection) studentQuery = studentQuery.eq("section", studentSection);
    
    const { data: matchedStudents, error: studentErr } = await studentQuery;
    if (studentErr) {
      logger.error("Error filtering by student registry:", studentErr);
      throw studentErr;
    }
    
    const studentIds = (matchedStudents ?? []).map(s => s.id);
    if (studentIds.length === 0) {
      // Return null to indicate no records match the filter
      return null;
    }
    query = query.in("student_id", studentIds);
  }

  return query;
}

/**
 * Helper to return an empty analytics response structure
 */
function getEmptyAnalyticsResponse() {
  return {
    kpis: {
      total_feedback: 0,
      positive_feedback: 0,
      negative_feedback: 0,
      mixed_feedback: 0,
      neutral_feedback: 0,
      critical_issues: 0,
      open_issues: 0,
      resolved_issues: 0,
      under_review_issues: 0,
      pending_ai_processing: 0,
    },
    trends: [],
    categories: [],
    sentiments: [],
    priorities: [],
    statuses: [],
    submitterTypes: [],
    resolution: {
      total_resolved: 0,
      open_issues: 0,
      resolution_rate: 0,
      avg_resolution_time_hours: 0,
      monthly_trends: [],
    },
    mostReported: [],
  };
}

/**
 * GET /reports/overview
 * Dashboard KPI cards data. Supports dynamic filters.
 */
router.get(
  "/overview",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query);
    if (!query) {
      res.json({ success: true, data: getEmptyAnalyticsResponse().kpis });
      return;
    }

    const { data, error } = await query;
    if (error) throw error;

    let total = 0;
    let positive = 0;
    let negative = 0;
    let critical = 0;
    let open = 0;
    let resolved = 0;
    let pending = 0;

    (data ?? []).forEach((f: any) => {
      total++;
      if (f.sentiment === "Positive") positive++;
      if (f.sentiment === "Negative") negative++;
      if (f.priority === "Critical") critical++;
      if (f.status === "new" || f.status === "under_review") open++;
      if (f.status === "resolved") resolved++;
      if (!f.ai_processed) pending++;
    });

    res.json({
      success: true,
      data: {
        total_feedback: total,
        positive_feedback: positive,
        negative_feedback: negative,
        critical_issues: critical,
        open_issues: open,
        resolved_issues: resolved,
        pending_ai_processing: pending,
      },
    });
  })
);

/**
 * GET /reports/trends
 * Time-series data for the feedback trend chart. Supports dynamic filters.
 */
router.get(
  "/trends",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query);
    if (!query) {
      res.json({ success: true, data: [] });
      return;
    }

    const { data, error } = await query;
    if (error) throw error;

    const dailyTrends: Record<
      string,
      { total: number; positive: number; negative: number; critical: number }
    > = {};

    (data ?? []).forEach((item: any) => {
      const date = item.created_at.split("T")[0];
      if (!dailyTrends[date]) {
        dailyTrends[date] = { total: 0, positive: 0, negative: 0, critical: 0 };
      }
      dailyTrends[date].total++;
      if (item.sentiment === "Positive") dailyTrends[date].positive++;
      if (item.sentiment === "Negative") dailyTrends[date].negative++;
      if (item.priority === "Critical") dailyTrends[date].critical++;
    });

    const trends = Object.entries(dailyTrends)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({ success: true, data: trends });
  })
);

/**
 * GET /reports/categories
 * Category distribution for pie chart. Supports dynamic filters.
 */
router.get(
  "/categories",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query);
    if (!query) {
      res.json({ success: true, data: [] });
      return;
    }

    const { data, error } = await query;
    if (error) throw error;

    const counts: Record<string, number> = {};
    (data ?? []).forEach((item: any) => {
      if (item.category) {
        counts[item.category] = (counts[item.category] ?? 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const breakdown = Object.entries(counts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    res.json({ success: true, data: breakdown });
  })
);

/**
 * GET /reports/analytics
 * Returns complete aggregated statistics for Analytics sections.
 */
router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query);
    if (!query) {
      res.json({ success: true, data: getEmptyAnalyticsResponse() });
      return;
    }

    const { data, error } = await query;
    if (error) throw error;

    let total = 0;
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let mixed = 0;
    let critical = 0;
    let open = 0;
    let resolved = 0;
    let underReview = 0;
    let pendingAI = 0;

    const categoryCounts: Record<string, number> = {};
    const sentimentCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const submitterTypeCounts: Record<string, number> = {};
    const feedbackScopeCounts: Record<string, number> = {
      student_specific: 0,
      multiple_students: 0,
      general_school: 0,
    };
    const relationshipCounts: Record<string, number> = {
      Father: 0,
      Mother: 0,
      Guardian: 0,
      Other: 0,
    };
    const dailyTrends: Record<
      string,
      { total: number; positive: number; negative: number; neutral: number; mixed: number; critical: number }
    > = {};

    let totalResolutionTimeMs = 0;
    let resolvedCount = 0;
    const monthlyResolution: Record<string, { totalTimeMs: number; count: number }> = {};

    (data ?? []).forEach((f: any) => {
      total++;
      if (f.sentiment === "Positive") positive++;
      if (f.sentiment === "Negative") negative++;
      if (f.sentiment === "Neutral") neutral++;
      if (f.sentiment === "Mixed") mixed++;

      if (f.sentiment) {
        sentimentCounts[f.sentiment] = (sentimentCounts[f.sentiment] ?? 0) + 1;
      }

      if (f.priority === "Critical") critical++;
      if (f.priority) {
        priorityCounts[f.priority] = (priorityCounts[f.priority] ?? 0) + 1;
      }

      if (f.status === "new" || f.status === "under_review") open++;
      if (f.status === "resolved") resolved++;
      if (f.status === "under_review") underReview++;

      if (f.status) {
        statusCounts[f.status] = (statusCounts[f.status] ?? 0) + 1;
      }

      if (f.submitter_type) {
        submitterTypeCounts[f.submitter_type] = (submitterTypeCounts[f.submitter_type] ?? 0) + 1;
      }

      const scope = f.feedback_scope || "student_specific";
      feedbackScopeCounts[scope] = (feedbackScopeCounts[scope] ?? 0) + 1;

      if (f.submitter_relationship) {
        relationshipCounts[f.submitter_relationship] = (relationshipCounts[f.submitter_relationship] ?? 0) + 1;
      }

      if (!f.ai_processed) pendingAI++;

      if (f.category) {
        categoryCounts[f.category] = (categoryCounts[f.category] ?? 0) + 1;
      }

      // Resolution metrics
      if (f.status === "resolved" && f.resolved_at) {
        resolvedCount++;
        const resolvedTime = new Date(f.resolved_at).getTime();
        const createdTime = new Date(f.created_at).getTime();
        const diffMs = resolvedTime - createdTime;
        if (diffMs >= 0) {
          totalResolutionTimeMs += diffMs;

          const month = f.resolved_at.slice(0, 7); // YYYY-MM
          if (!monthlyResolution[month]) {
            monthlyResolution[month] = { totalTimeMs: 0, count: 0 };
          }
          monthlyResolution[month].totalTimeMs += diffMs;
          monthlyResolution[month].count++;
        }
      }

      const dateStr = f.created_at.slice(0, 10);
      if (!dailyTrends[dateStr]) {
        dailyTrends[dateStr] = { total: 0, positive: 0, negative: 0, neutral: 0, mixed: 0, critical: 0 };
      }
      dailyTrends[dateStr].total++;
      if (f.sentiment === "Positive") dailyTrends[dateStr].positive++;
      if (f.sentiment === "Negative") dailyTrends[dateStr].negative++;
      if (f.sentiment === "Neutral") dailyTrends[dateStr].neutral++;
      if (f.sentiment === "Mixed") dailyTrends[dateStr].mixed++;
      if (f.priority === "Critical") dailyTrends[dateStr].critical++;
    });

    const categories = Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category: category as any,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const sentiments = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      sentiment: sentiment as any,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const priorities = Object.entries(priorityCounts).map(([priority, count]) => ({
      priority: priority as any,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const statuses = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as any,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const submitterTypes = Object.entries(submitterTypeCounts).map(([submitter_type, count]) => ({
      submitter_type: submitter_type as any,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const feedbackScopes = Object.entries(feedbackScopeCounts).map(([scope, count]) => ({
      feedback_scope: scope,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const relationships = Object.entries(relationshipCounts).map(([relationship, count]) => ({
      relationship,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    const trends = Object.entries(dailyTrends)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const avgResolutionTimeHours = resolvedCount > 0 ? totalResolutionTimeMs / resolvedCount / (1000 * 60 * 60) : 0;
    const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

    const monthlyTrends = Object.entries(monthlyResolution)
      .map(([month, stats]) => ({
        month,
        resolved_count: stats.count,
        avg_time_hours: stats.totalTimeMs / stats.count / (1000 * 60 * 60),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const resolution = {
      total_resolved: resolvedCount,
      open_issues: open,
      resolution_rate: resolutionRate,
      avg_resolution_time_hours: parseFloat(avgResolutionTimeHours.toFixed(1)),
      monthly_trends: monthlyTrends,
    };

    const mostReported = categories.slice(0, 5).map((c) => ({
      category: c.category,
      count: c.count,
    }));

    const kpis = {
      total_feedback: total,
      positive_feedback: positive,
      negative_feedback: negative,
      mixed_feedback: mixed,
      neutral_feedback: neutral,
      critical_issues: critical,
      open_issues: open,
      resolved_issues: resolved,
      under_review_issues: underReview,
      pending_ai_processing: pendingAI,
    };

    res.json({
      success: true,
      data: {
        kpis,
        trends,
        categories,
        sentiments,
        priorities,
        statuses,
        submitterTypes,
        feedbackScopes,
        relationships,
        resolution,
        mostReported,
      },
    });
  })
);

/**
 * GET /reports/export/excel
 * Exports filtered feedback list as an Excel spreadsheet.
 */
router.get(
  "/export/excel",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query, true);
    if (!query) {
      res.status(404).send("No feedback records match the specified filters.");
      return;
    }

    const { data: records, error } = await query;
    if (error) throw error;

    if (!records || records.length === 0) {
      res.status(404).send("No feedback records match the specified filters.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("AAA Feedback Records");

    // Header styling
    sheet.columns = [
      { header: "Feedback ID", key: "id", width: 36 },
      { header: "Tracking Number", key: "tracking_number", width: 20 },
      { header: "Date Submitted", key: "created_at", width: 22 },
      { header: "Submission Type", key: "submission_type", width: 18 },
      { header: "Original Text", key: "raw_text", width: 50 },
      { header: "AI Summary", key: "summary", width: 40 },
      { header: "Category", key: "category", width: 15 },
      { header: "Sentiment", key: "sentiment", width: 12 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Status", key: "status", width: 15 },
      { header: "Submitter Name", key: "submitter", width: 20 },
      { header: "Submitter Phone", key: "phone", width: 18 },
      { header: "Student Name", key: "student_name", width: 22 },
      { header: "Admission No", key: "admission_no", width: 18 },
      { header: "Class", key: "class", width: 10 },
      { header: "Section", key: "section", width: 10 },
      { header: "Date Resolved", key: "resolved_at", width: 22 },
    ];

    sheet.getRow(1).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF102A43" }, // Navy blue for Ayesha Ali Academy branding
    };

    records.forEach((r: any) => {
      const isAnon = r.is_anonymous || r.submission_type === "anonymous";
      const studentObj = r.students;

      sheet.addRow({
        id: r.id,
        tracking_number: r.tracking_number || "N/A",
        created_at: new Date(r.created_at).toLocaleString(),
        submission_type: r.submission_type,
        raw_text: r.raw_text,
        summary: r.summary || "Pending",
        category: r.category || "Pending",
        sentiment: r.sentiment || "Pending",
        priority: r.priority || "Pending",
        status: r.status,
        submitter: isAnon ? "Anonymous" : (r.submitter_name || "N/A"),
        phone: isAnon ? "Anonymous" : (r.submitter_phone || "N/A"),
        student_name: isAnon ? "Anonymous" : (studentObj?.student_name || "N/A"),
        admission_no: isAnon ? "Anonymous" : (studentObj?.admission_no || "N/A"),
        class: isAnon ? "Anonymous" : (studentObj?.class || "N/A"),
        section: isAnon ? "Anonymous" : (studentObj?.section || "N/A"),
        resolved_at: r.resolved_at ? new Date(r.resolved_at).toLocaleString() : "Unresolved",
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="AAA_Feedback_Report_${new Date().toISOString().slice(0, 10)}.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  })
);

/**
 * GET /reports/export/pdf
 * Exports filtered feedback list as a branded Ayesha Ali Academy PDF.
 */
router.get(
  "/export/pdf",
  asyncHandler(async (req, res) => {
    const query = await buildFilteredFeedbackQuery(req.query, true);
    if (!query) {
      res.status(404).send("No feedback records match the specified filters.");
      return;
    }

    const { data: records, error } = await query;
    if (error) throw error;

    if (!records || records.length === 0) {
      res.status(404).send("No feedback records match the specified filters.");
      return;
    }

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="AAA_Feedback_Report_${new Date().toISOString().slice(0, 10)}.pdf"`
    );

    doc.pipe(res);

    // ── PDF Design — Ayesha Ali Academy colors ──
    // Primary: Navy Blue (#102A43), Accent: Gold (#D9A74A)

    // School Logo Centered
    const logoWidth = 160;
    const logoX = (doc.page.width - logoWidth) / 2;
    const logoPath = path.join(process.cwd(), "assets/logo.png");

    try {
      doc.image(logoPath, logoX, 20, { width: logoWidth });
    } catch (imageErr) {
      logger.error("Failed to load school logo image in PDF generation:", imageErr);
    }

    // Centered Title
    doc.fillColor("#102A43")
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("AYESHA ALI ACADEMY", 0, 92, { align: "center", width: doc.page.width });

    // Centered Tagline
    doc.fillColor("#D9A74A")
      .font("Helvetica-Bold")
      .fontSize(9.5)
      .text("ABOVE & AHEAD", 0, 112, { align: "center", width: doc.page.width });

    // Centered Report Header
    doc.fillColor("#627D98")
      .font("Helvetica")
      .fontSize(9)
      .text("Feedback Management System Report", 0, 126, { align: "center", width: doc.page.width });

    // Header divider line
    doc.strokeColor("#E4E7EB")
      .lineWidth(1)
      .moveTo(40, 145)
      .lineTo(doc.page.width - 40, 145)
      .stroke();

    // Executive Summary Section
    doc.fillColor("#102A43")
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Executive Summary", 40, 162);

    doc.strokeColor("#D9A74A").lineWidth(2).moveTo(40, 178).lineTo(145, 178).stroke();

    // Date
    doc.fillColor("#627D98")
      .font("Helvetica")
      .fontSize(9)
      .text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 160, 164, { align: "right", width: 120 });

    // Statistics Box
    const startY = 192;
    doc.rect(40, startY, doc.page.width - 80, 70).fill("#F0F4F8");

    doc.fillColor("#102A43").font("Helvetica-Bold").fontSize(10);
    doc.text("Total Submissions:", 55, startY + 15);
    doc.text("Resolved Issues:", 55, startY + 30);
    doc.text("Open Issues:", 55, startY + 45);

    doc.text("Positive Sentiment:", 280, startY + 15);
    doc.text("Negative Sentiment:", 280, startY + 30);
    doc.text("Critical Priority:", 280, startY + 45);

    // Stats calculations
    const totalCount = records.length;
    const resolvedCount = records.filter((r: any) => r.status === "resolved").length;
    const openCount = totalCount - resolvedCount;
    const positiveCount = records.filter((r: any) => r.sentiment === "Positive").length;
    const negativeCount = records.filter((r: any) => r.sentiment === "Negative").length;
    const criticalCount = records.filter((r: any) => r.priority === "Critical").length;

    doc.font("Helvetica");
    doc.text(String(totalCount), 155, startY + 15);
    doc.text(String(resolvedCount), 155, startY + 30);
    doc.text(String(openCount), 155, startY + 45);

    doc.text(String(positiveCount), 385, startY + 15);
    doc.text(String(negativeCount), 385, startY + 30);
    doc.text(String(criticalCount), 385, startY + 45);

    doc.moveDown(3);

    // Records header
    doc.fillColor("#102A43")
      .font("Helvetica-Bold")
      .fontSize(14)
      .text("Feedback Logs", 40, startY + 95);

    doc.strokeColor("#D9A74A").lineWidth(2).moveTo(40, startY + 113).lineTo(130, startY + 113).stroke();

    let currentRecordY = startY + 130;

    records.forEach((record: any) => {
      // Check for page break
      if (currentRecordY > doc.page.height - 120) {
        doc.addPage();
        currentRecordY = 50;
      }

      const isAnon = record.is_anonymous || record.submission_type === "anonymous";

      doc.rect(40, currentRecordY, doc.page.width - 80, 75).fill("#FFFFFF");
      doc.rect(40, currentRecordY, doc.page.width - 80, 75).stroke("#E4E7EB");

      // ID and Date
      doc.fillColor("#102A43")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(`Ref: ${record.tracking_number || record.id.substring(0, 8)}`, 55, currentRecordY + 10);

      const dateStr = new Date(record.created_at).toLocaleDateString();
      doc.fillColor("#627D98")
        .font("Helvetica")
        .fontSize(9)
        .text(`Date: ${dateStr}`, doc.page.width - 160, currentRecordY + 10, { align: "right", width: 100 });

      // Submitter Name
      const submitterName = isAnon ? "Anonymous Student" : (record.submitter_name || "N/A");
      const submitterClass = isAnon ? "" : (record.students?.class ? ` (Class ${record.students.class}-${record.students.section})` : "");
      doc.fillColor("#334E68")
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .text(`From: ${submitterName}${submitterClass}`, 55, currentRecordY + 25);

      // Metadata summary
      const categoryStr = record.category || "Pending";
      const sentimentStr = record.sentiment || "Pending";
      const priorityStr = record.priority || "Pending";
      const statusStr = record.status.toUpperCase();
      
      doc.fillColor("#627D98")
        .font("Helvetica")
        .fontSize(8)
        .text(`Category: ${categoryStr} | Sentiment: ${sentimentStr} | Priority: ${priorityStr} | Status: ${statusStr}`, 55, currentRecordY + 38);

      // summary/raw text
      const textToPrint = record.summary || record.raw_text.substring(0, 115) + "...";
      doc.fillColor("#102A43")
        .font("Helvetica-Oblique")
        .fontSize(9.5)
        .text(`"${textToPrint}"`, 55, currentRecordY + 52, { width: doc.page.width - 110, height: 20 });

      currentRecordY += 90;
    });

    // Page numbering helper
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fillColor("#9AA5B1")
        .font("Helvetica")
        .fontSize(8)
        .text(`Page ${i + 1} of ${range.count}`, 40, doc.page.height - 25, { align: "center", width: doc.page.width - 80 });
      
      doc.text("Developed by Burhan Hamid", 40, doc.page.height - 25, { align: "right", width: doc.page.width - 80 });
    }

    doc.end();
  })
);

export default router;
