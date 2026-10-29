"""
generate_word.py
Generates the CampusCloud college-project Word document with screenshots.
Run:  python generate_word.py
Output: CampusCloud_Project_Report.docx  (in the current directory)
"""

import os
import glob
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

SCREENSHOTS_DIR = r"C:\Users\ujjwal khatri\.gemini\antigravity\brain\9b743e5f-0cb5-4603-8730-58cdde444cbd\screenshots"
OUTPUT_FILE = r"c:\Users\ujjwal khatri\OneDrive\Desktop\aws\CampusCloud_Project_Report.docx"

NAVY   = RGBColor(0x0f, 0x17, 0x2a)
VIOLET = RGBColor(0x7c, 0x3a, 0xed)
SLATE  = RGBColor(0x64, 0x74, 0x8b)
WHITE  = RGBColor(0xff, 0xff, 0xff)
LIGHT_BG = RGBColor(0xf1, 0xf5, 0xf9)

# ── helpers ────────────────────────────────────────────────────────────────────

def set_cell_bg(cell, hex_color: str):
    """Set table cell background colour."""
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tcPr.append(shd)


def add_heading(doc: Document, text: str, level: int = 1):
    p = doc.add_heading(text, level=level)
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    run = p.runs[0] if p.runs else p.add_run(text)
    if level == 1:
        run.font.color.rgb = NAVY
        run.font.size = Pt(18)
        run.bold = True
    elif level == 2:
        run.font.color.rgb = VIOLET
        run.font.size = Pt(14)
        run.bold = True
    else:
        run.font.color.rgb = SLATE
        run.font.size = Pt(12)
    return p


def add_body(doc: Document, text: str, bold=False, color=None, size=11):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color
    return p


def add_screenshot(doc: Document, path: str, caption: str, width=Inches(6.0)):
    """Insert an image with a caption below it, centred."""
    if not os.path.exists(path):
        add_body(doc, f"[Screenshot not found: {os.path.basename(path)}]", color=RGBColor(0xff,0,0))
        return
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run()
    run.add_picture(path, width=width)

    cap = doc.add_paragraph(caption)
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_run = cap.runs[0]
    cap_run.font.size = Pt(9)
    cap_run.font.italic = True
    cap_run.font.color.rgb = SLATE
    doc.add_paragraph()  # spacer


def add_divider(doc: Document):
    p = doc.add_paragraph()
    pPr = p._p.get_or_add_pPr()
    pBdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "4")
    bottom.set(qn("w:space"), "1")
    bottom.set(qn("w:color"), "7C3AED")
    pBdr.append(bottom)
    pPr.append(pBdr)


def add_info_table(doc: Document, rows: list[tuple[str, str]]):
    table = doc.add_table(rows=len(rows), cols=2)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    for i, (label, value) in enumerate(rows):
        row = table.rows[i]
        row.cells[0].text = label
        row.cells[1].text = value
        set_cell_bg(row.cells[0], "EDE9FE")
        lrun = row.cells[0].paragraphs[0].runs
        if lrun:
            lrun[0].bold = True
            lrun[0].font.color.rgb = VIOLET
        row.cells[0].width = Cm(5)
        row.cells[1].width = Cm(11)
    doc.add_paragraph()


def find_screenshot(name: str) -> str:
    """Find screenshot by partial name."""
    pattern = os.path.join(SCREENSHOTS_DIR, f"*{name}*")
    matches = sorted(glob.glob(pattern))
    return matches[0] if matches else ""


# ── main document ──────────────────────────────────────────────────────────────

def build_document():
    doc = Document()

    # Page margins
    for section in doc.sections:
        section.top_margin    = Cm(2.0)
        section.bottom_margin = Cm(2.0)
        section.left_margin   = Cm(2.5)
        section.right_margin  = Cm(2.5)

    # Default font
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(11)

    # ── Cover Page ─────────────────────────────────────────────────────────────
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run("☁  CampusCloud")
    run.font.size = Pt(36)
    run.font.bold = True
    run.font.color.rgb = NAVY

    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run2 = p2.add_run("Smart Student Management Portal")
    run2.font.size = Pt(20)
    run2.font.color.rgb = VIOLET

    doc.add_paragraph()
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run3 = p3.add_run("Cloud Computing Project Report")
    run3.font.size = Pt(14)
    run3.bold = True
    run3.font.color.rgb = SLATE

    doc.add_paragraph()

    add_info_table(doc, [
        ("Project Title",   "CampusCloud — Smart Student Management Portal"),
        ("Subject",         "Cloud Computing (AWS)"),
        ("Technology Stack","React + Vite | Flask | SQLite | Amazon DynamoDB"),
        ("AWS Services",    "EC2 · DynamoDB · CloudWatch · Auto Scaling · IAM"),
        ("Submitted By",    "Ujjwal Khatri"),
        ("Date",            "October 2026"),
    ])

    doc.add_page_break()

    # ── Section 1: Project Overview ────────────────────────────────────────────
    add_heading(doc, "1. Project Overview", 1)
    add_divider(doc)
    doc.add_paragraph(
        "CampusCloud is a full-stack, cloud-enabled Student Management Portal built to demonstrate "
        "the real-world application of AWS cloud services in an educational context. The system provides "
        "a modern SaaS-style dashboard where administrators can register, search, edit, and delete student "
        "records stored in either a local SQLite database (development) or Amazon DynamoDB (production)."
    )
    doc.add_paragraph()

    add_heading(doc, "Key Objectives", 2)
    for obj in [
        "✔  Build a visually polished, responsive student-record management system.",
        "✔  Demonstrate cloud persistence using Amazon DynamoDB via Boto3.",
        "✔  Host the backend on Amazon EC2 with Gunicorn + Nginx.",
        "✔  Monitor CPU utilisation via Amazon CloudWatch.",
        "✔  Auto-scale the EC2 fleet with a target-tracking scaling policy.",
        "✔  Secure AWS access using IAM Roles — no hard-coded credentials.",
    ]:
        p = doc.add_paragraph(obj, style="List Bullet")
        p.runs[0].font.size = Pt(11)

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 2: Technology Stack ────────────────────────────────────────────
    add_heading(doc, "2. Technology Stack", 1)
    add_divider(doc)

    table = doc.add_table(rows=1, cols=3)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    for cell, label in zip(hdr, ["Layer", "Technology", "Purpose"]):
        set_cell_bg(cell, "0F172A")
        p = cell.paragraphs[0]
        run = p.add_run(label)
        run.bold = True
        run.font.color.rgb = WHITE
        run.font.size = Pt(11)
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    rows = [
        ("Frontend",  "React 19 + Vite 6",          "SPA with component-based UI"),
        ("Styling",   "Tailwind CSS v4",             "Utility-first, responsive design"),
        ("Icons",     "Lucide React",                "Consistent icon system"),
        ("Backend",   "Python Flask 3",              "REST API server"),
        ("Local DB",  "SQLite (python built-in)",    "Zero-config local persistence"),
        ("Cloud DB",  "Amazon DynamoDB",             "Serverless NoSQL at scale"),
        ("AWS SDK",   "Boto3",                       "DynamoDB / CloudWatch API calls"),
        ("Server",    "Gunicorn + Nginx",            "Production WSGI + reverse proxy"),
        ("Hosting",   "Amazon EC2 (Ubuntu 22.04)",   "Virtual machine deployment"),
        ("Scaling",   "EC2 Auto Scaling Group",      "Elastic horizontal scaling"),
        ("Monitor",   "Amazon CloudWatch",           "CPU & request metrics"),
        ("Security",  "IAM Role",                    "Credential-free AWS access"),
    ]
    for layer, tech, purpose in rows:
        row = table.add_row().cells
        row[0].text = layer
        row[1].text = tech
        row[2].text = purpose
        set_cell_bg(row[0], "EDE9FE")
        for c in row:
            c.paragraphs[0].runs[0].font.size = Pt(10) if c.paragraphs[0].runs else None

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 3: AWS Architecture ────────────────────────────────────────────
    add_heading(doc, "3. AWS Cloud Architecture", 1)
    add_divider(doc)
    doc.add_paragraph(
        "The diagram below shows how each AWS service fits into the CampusCloud architecture:"
    )
    doc.add_paragraph()

    # ASCII-style arch box
    arch_text = (
        "  ┌─────────────────────────────────────────────────────────┐\n"
        "  │                     Internet / Browser                   │\n"
        "  └───────────────────────────┬─────────────────────────────┘\n"
        "                              │ HTTP\n"
        "  ┌───────────────────────────▼─────────────────────────────┐\n"
        "  │              Amazon EC2  (Auto Scaling Group)            │\n"
        "  │   Ubuntu 22.04 · Nginx (port 80)  → Gunicorn (port 5000)│\n"
        "  │                 Flask REST API (app.py)                  │\n"
        "  └──────────────┬──────────────────────┬────────────────────┘\n"
        "                 │ DynamoDB API           │ CloudWatch API\n"
        "  ┌──────────────▼──────────┐  ┌─────────▼──────────────────┐\n"
        "  │   Amazon DynamoDB       │  │  Amazon CloudWatch         │\n"
        "  │   campus_students table │  │  CPU & custom metrics      │\n"
        "  └─────────────────────────┘  └────────────────────────────┘\n"
        "                 │ IAM Role (no keys)\n"
        "  ┌──────────────▼──────────────────────────────────────────┐\n"
        "  │              AWS IAM  (EC2 instance role)                │\n"
        "  │  AmazonDynamoDBFullAccess · CloudWatchAgentServerPolicy  │\n"
        "  └──────────────────────────────────────────────────────────┘"
    )
    p = doc.add_paragraph()
    run = p.add_run(arch_text)
    run.font.name = "Courier New"
    run.font.size = Pt(8)
    run.font.color.rgb = NAVY

    doc.add_paragraph()

    add_heading(doc, "AWS Services Explained", 2)
    services = [
        ("Amazon EC2",        "Hosts the Flask backend. Ubuntu 22.04, t3.micro. Accessible on port 80 via Nginx."),
        ("Auto Scaling Group","Monitors CPU; spins new EC2 instances when utilisation exceeds 60%."),
        ("Amazon DynamoDB",   "Serverless key-value store. Table: campus_students, partition key: id (String)."),
        ("IAM Role",          "Attached to EC2; grants DynamoDB + CloudWatch access without any hard-coded credentials."),
        ("Amazon CloudWatch", "Collects CPU metrics from EC2. Alarm triggers Auto Scaling policy."),
    ]
    for svc, desc in services:
        p = doc.add_paragraph(style="List Bullet")
        run1 = p.add_run(f"{svc}: ")
        run1.bold = True
        run1.font.color.rgb = VIOLET
        run2 = p.add_run(desc)
        run2.font.size = Pt(10)

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 4: Features Implemented ───────────────────────────────────────
    add_heading(doc, "4. Features Implemented", 1)
    add_divider(doc)
    features = [
        ("Dashboard",          "Statistics cards (Total Students, Courses, Registrations, Cloud Status), recent-activity feed, hero banner."),
        ("Add Student",        "Modal form with full validation: required fields, email format check, duplicate student-ID detection."),
        ("Edit Student",       "Pre-filled modal; PUT /api/students/<id> updates the record in SQLite or DynamoDB."),
        ("Delete Student",     "Confirmation modal before DELETE /api/students/<id>."),
        ("Student Table",      "Searchable (name, ID, email) and filterable by course; colour-coded avatars; date registered column."),
        ("Cloud & AWS Page",   "Live DB-mode indicator, architecture card grid, step-by-step deployment guide."),
        ("DB Mode Indicator",  "Sidebar badge shows 'Local SQLite' or 'AWS DynamoDB' — no fake status."),
        ("Toast Notifications","Success/error toasts with auto-dismiss and manual close."),
        ("Responsive Layout",  "Sidebar collapses on mobile; cards reflow with CSS grid auto-fit."),
        ("Loading States",     "Skeleton loaders and spinner animations while fetching data."),
        ("Empty State",        "Friendly illustration + CTA when no students exist."),
    ]
    table2 = doc.add_table(rows=1, cols=2)
    table2.style = "Table Grid"
    for cell, lbl in zip(table2.rows[0].cells, ["Feature", "Description"]):
        set_cell_bg(cell, "0F172A")
        run = cell.paragraphs[0].add_run(lbl)
        run.bold = True
        run.font.color.rgb = WHITE

    for feat, desc in features:
        row = table2.add_row().cells
        row[0].text = feat
        row[1].text = desc
        set_cell_bg(row[0], "F5F3FF")
        if row[0].paragraphs[0].runs:
            row[0].paragraphs[0].runs[0].bold = True

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 5: Screenshots ─────────────────────────────────────────────────
    add_heading(doc, "5. Application Screenshots", 1)
    add_divider(doc)
    doc.add_paragraph(
        "The following screenshots were captured from the live running application at http://localhost:5173."
    )
    doc.add_paragraph()

    screenshots = [
        ("ss01_dashboard",     "Figure 1 — Dashboard: Hero banner, statistics cards, and recent registrations"),
        ("ss02_modal_open",    "Figure 2 — Register Student modal (empty form)"),
        ("ss03_form_filled",   "Figure 3 — Registration form filled in for student Priya Sharma"),
        ("ss04_student_added", "Figure 4 — Success toast after adding the first student"),
        ("ss05_second_student","Figure 5 — Dashboard after adding second student (Rahul Verma)"),
        ("ss06_students_table","Figure 6 — Students page: searchable table with both students"),
        ("ss07_edit_modal",    "Figure 7 — Edit Student modal with pre-filled data"),
        ("ss08_student_updated","Figure 8 — Students table after course update"),
        ("ss09_cloud_page",    "Figure 9 — Cloud & AWS Architecture page with deployment guide"),
        ("ss10_final_dashboard","Figure 10 — Final Dashboard view with live statistics"),
    ]

    for key, caption in screenshots:
        path = find_screenshot(key)
        add_screenshot(doc, path, caption)

    doc.add_page_break()

    # ── Section 6: API Reference ───────────────────────────────────────────────
    add_heading(doc, "6. REST API Reference", 1)
    add_divider(doc)

    api_rows = [
        ("GET",    "/api/status",            "Returns DB mode, version, and AWS connection status"),
        ("GET",    "/api/stats",             "Returns total students, courses breakdown, recent entries"),
        ("GET",    "/api/students",          "List all students (supports ?q= search and ?course= filter)"),
        ("POST",   "/api/students",          "Add a new student (JSON body)"),
        ("GET",    "/api/students/<id>",     "Fetch a single student by UUID"),
        ("PUT",    "/api/students/<id>",     "Update a student's details"),
        ("DELETE", "/api/students/<id>",     "Delete a student record"),
    ]
    api_table = doc.add_table(rows=1, cols=3)
    api_table.style = "Table Grid"
    for cell, lbl in zip(api_table.rows[0].cells, ["Method", "Endpoint", "Description"]):
        set_cell_bg(cell, "0F172A")
        run = cell.paragraphs[0].add_run(lbl)
        run.bold = True
        run.font.color.rgb = WHITE

    method_colors = {"GET": "DBEAFE", "POST": "DCFCE7", "PUT": "FEF9C3", "DELETE": "FEE2E2"}
    for method, endpoint, desc in api_rows:
        row = api_table.add_row().cells
        row[0].text = method
        row[1].text = endpoint
        row[2].text = desc
        set_cell_bg(row[0], method_colors.get(method, "FFFFFF"))
        if row[0].paragraphs[0].runs:
            row[0].paragraphs[0].runs[0].bold = True
        if row[1].paragraphs[0].runs:
            row[1].paragraphs[0].runs[0].font.name = "Courier New"
            row[1].paragraphs[0].runs[0].font.size = Pt(9)

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 7: Setup Instructions ─────────────────────────────────────────
    add_heading(doc, "7. Local Setup Instructions", 1)
    add_divider(doc)

    add_heading(doc, "Backend (Flask)", 2)
    steps_be = [
        "cd backend",
        "pip install -r requirements.txt",
        "# Copy environment variables:",
        "copy .env.example .env",
        "# Run the Flask dev server:",
        "python app.py",
        "# Backend available at http://localhost:5000",
    ]
    p = doc.add_paragraph()
    run = p.add_run("\n".join(steps_be))
    run.font.name = "Courier New"
    run.font.size = Pt(9)
    run.font.color.rgb = NAVY
    p.paragraph_format.left_indent = Cm(0.5)

    doc.add_paragraph()
    add_heading(doc, "Frontend (React + Vite)", 2)
    steps_fe = [
        "cd frontend",
        "npm install",
        "npm run dev",
        "# Frontend available at http://localhost:5173",
    ]
    p2 = doc.add_paragraph()
    run2 = p2.add_run("\n".join(steps_fe))
    run2.font.name = "Courier New"
    run2.font.size = Pt(9)
    run2.font.color.rgb = NAVY
    p2.paragraph_format.left_indent = Cm(0.5)

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 8: AWS Deployment ──────────────────────────────────────────────
    add_heading(doc, "8. AWS Deployment Steps", 1)
    add_divider(doc)

    steps_aws = [
        ("Step 1 — Launch EC2",
         "Launch a t3.micro Ubuntu 22.04 instance in your VPC. Open ports 22 (SSH), 80 (HTTP), and 5000 (Flask) in the Security Group."),
        ("Step 2 — Create DynamoDB Table",
         "Table name: campus_students\nPartition key: id (String)\nBilling mode: On-demand (PAY_PER_REQUEST)"),
        ("Step 3 — Create IAM Role",
         "Create an EC2 IAM Role with:\n  • AmazonDynamoDBFullAccess\n  • CloudWatchAgentServerPolicy\nAttach the role to your EC2 instance."),
        ("Step 4 — Install Dependencies",
         "sudo apt update && sudo apt install python3-pip nginx -y\ngit clone <your-repo> campuscloud\ncd campuscloud/backend\npip3 install -r requirements.txt"),
        ("Step 5 — Configure Environment",
         "sudo nano /etc/environment\nAdd:\n  DB_MODE=aws\n  DYNAMO_TABLE=campus_students\n  AWS_REGION=us-east-1"),
        ("Step 6 — Run with Gunicorn",
         "gunicorn -w 4 -b 127.0.0.1:5000 app:app --daemon"),
        ("Step 7 — Configure Nginx",
         "proxy_pass http://127.0.0.1:5000 in your server block"),
        ("Step 8 — Build & Deploy Frontend",
         "cd frontend && npm run build\nServe the dist/ folder via Nginx static files"),
        ("Step 9 — Set Up Auto Scaling",
         "Create a Launch Template from your EC2 instance.\nCreate Auto Scaling Group with:\n  • Min 1, Max 3 instances\n  • Target-tracking policy: CPU @ 60%"),
        ("Step 10 — CloudWatch Alarm",
         "Create CPUUtilization alarm → trigger scale-out when CPU > 60% for 2 consecutive 5-minute periods."),
    ]
    for title, body in steps_aws:
        add_heading(doc, title, 3)
        p = doc.add_paragraph(body)
        p.runs[0].font.size = Pt(10)
        doc.add_paragraph()

    doc.add_page_break()

    # ── Section 9: Database Schema ─────────────────────────────────────────────
    add_heading(doc, "9. Database Schema", 1)
    add_divider(doc)
    add_heading(doc, "SQLite / DynamoDB — students table", 2)

    schema_rows = [
        ("id",         "String (UUID)",  "Primary Key — auto-generated"),
        ("student_id", "String",         "Unique student roll number"),
        ("name",       "String",         "Full name of the student"),
        ("email",      "String",         "Email address (validated)"),
        ("course",     "String",         "Enrolled course name"),
        ("created_at", "ISO 8601 String","Record creation timestamp (UTC)"),
        ("updated_at", "ISO 8601 String","Last modified timestamp (UTC)"),
    ]
    sc_table = doc.add_table(rows=1, cols=3)
    sc_table.style = "Table Grid"
    for cell, lbl in zip(sc_table.rows[0].cells, ["Field", "Type", "Notes"]):
        set_cell_bg(cell, "0F172A")
        run = cell.paragraphs[0].add_run(lbl)
        run.bold = True
        run.font.color.rgb = WHITE

    for field, ftype, notes in schema_rows:
        row = sc_table.add_row().cells
        row[0].text = field
        row[1].text = ftype
        row[2].text = notes
        set_cell_bg(row[0], "EDE9FE")
        if row[0].paragraphs[0].runs:
            row[0].paragraphs[0].runs[0].bold = True
            row[0].paragraphs[0].runs[0].font.name = "Courier New"

    doc.add_paragraph()
    doc.add_page_break()

    # ── Section 10: Conclusion ─────────────────────────────────────────────────
    add_heading(doc, "10. Conclusion", 1)
    add_divider(doc)
    doc.add_paragraph(
        "CampusCloud successfully demonstrates how a modern, full-stack web application can be designed, "
        "built, and deployed on the AWS cloud platform. By combining a React-powered frontend with a Flask "
        "backend, SQLite for local development, and Amazon DynamoDB for production, the project provides a "
        "seamless developer experience while showcasing real cloud-computing concepts."
    )
    doc.add_paragraph()
    doc.add_paragraph(
        "The inclusion of EC2 Auto Scaling, CloudWatch monitoring, and IAM role-based access elevates the "
        "project from a basic CRUD application to a genuinely cloud-native solution — aligned with industry "
        "best practices for security, scalability, and observability."
    )
    doc.add_paragraph()
    add_body(doc, "Key Takeaways:", bold=True, color=VIOLET)
    for line in [
        "• Serverless NoSQL (DynamoDB) scales automatically without infrastructure management.",
        "• EC2 Auto Scaling ensures high availability under variable load.",
        "• IAM Roles eliminate the security risk of hard-coded AWS credentials.",
        "• CloudWatch provides real-time visibility into application health.",
        "• A modern SaaS-style UI improves usability and demonstrates UI/UX skills.",
    ]:
        doc.add_paragraph(line)

    # ── Footer watermark ───────────────────────────────────────────────────────
    doc.add_paragraph()
    p_foot = doc.add_paragraph("CampusCloud  ·  Cloud Computing Project  ·  2026  ·  Ujjwal Khatri")
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    for run in p_foot.runs:
        run.font.size = Pt(9)
        run.font.color.rgb = SLATE

    # ── Save ───────────────────────────────────────────────────────────────────
    doc.save(OUTPUT_FILE)
    print(f"\nWord document saved to:\n    {OUTPUT_FILE}\n")


if __name__ == "__main__":
    build_document()
