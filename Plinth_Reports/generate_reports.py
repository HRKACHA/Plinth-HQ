import os
from datetime import datetime, timedelta

def get_work_days(start_date, end_date):
    days = []
    current = start_date
    while current <= end_date:
        if current.weekday() < 5: # Monday to Friday
            days.append(current)
        current += timedelta(days=1)
    return days

start = datetime(2026, 5, 4)
end = datetime(2026, 7, 4)
work_days = get_work_days(start, end)

tasks = [
    # Week 1
    ("Installed React environment and created a starter project using Vite.", "Configured local setup successfully."),
    ("Studied the structure of web pages using JSX and applied Tailwind CSS styling.", "Understood utility-first CSS concepts."),
    ("Created basic static layouts including headers, footers, and main wrappers.", "Focused on component reusability."),
    ("Practiced React component architecture and created the PlinthLogo component.", "Learned about SVG manipulation in React."),
    ("Configured React Router for single-page application navigation between pages.", "Explored useNavigate and Link."),
    
    # Week 2
    ("Designed the main Dashboard layout using CSS Grid and Flexbox with responsive breakpoints.", "Focused on mobile-first design."),
    ("Developed small UI elements like custom buttons, badges, and the GlassSelect component.", "Improved interactive UI design skills."),
    ("Implemented the ProjectCard component to display individual construction projects.", "Used mock data for initial testing."),
    ("Created a DateAccordion component for daily logs with smooth CSS grid transitions.", "Solved transition lag issues."),
    ("Refined the homepage UI, added the hero section, and optimized mobile text spacing.", "Faced minor alignment issues and resolved them."),
    
    # Week 3
    ("Started developing the 'Add Project' form with comprehensive validation.", "Handled form state using React useState."),
    ("Created the VoiceInput component for logging details via Web Speech API.", "Learned about browser speech recognition."),
    ("Designed the PlinthAIChatbot UI for contextual assistance.", "Integrated message bubbles and auto-scrolling."),
    ("Implemented the layout for individual project details and command center.", "Focused on clean data presentation."),
    ("Finalized all frontend mockups and validated responsiveness across devices.", "Testing completed on various screen sizes."),
    
    # Week 4
    ("Started backend development using Node.js and Express.js.", "Set up the server and installed dependencies."),
    ("Connected the backend to MongoDB Atlas using Mongoose.", "Database connection successful."),
    ("Designed database schemas for Users, Projects, and Daily Logs.", "Focused on relationships between collections."),
    ("Developed user registration APIs with secure bcrypt password hashing.", "Used Postman for testing routes."),
    ("Implemented login APIs and generated JWT tokens for user authentication.", "Understood token-based auth flow."),
    
    # Week 5
    ("Created custom Express middleware to protect secure routes using JWT verification.", "Secured routes effectively."),
    ("Built CRUD APIs for managing construction projects (Create, Read, Update, Delete).", "Tested all edge cases."),
    ("Developed APIs to store and fetch daily logs, materials, and labor details.", "Ensured correct referencing to Project IDs."),
    ("Implemented error handling middleware to provide consistent API responses.", "Improved debugging efficiency."),
    ("Refactored backend code structure into separate controllers and routes files.", "Maintained modular architecture."),
    
    # Week 6
    ("Connected the React frontend to the backend APIs using Axios.", "Faced CORS issues and resolved them."),
    ("Integrated the login and registration forms with real backend authentication.", "Stored JWT tokens in localStorage."),
    ("Fetched real project data from the database and rendered it on the Dashboard.", "Replaced mock data with live data."),
    ("Implemented the 'Add Project' API call with proper loading states.", "Added toast notifications for success/error."),
    ("Linked daily logs submission form to the backend to persist construction updates.", "Ensured real-time UI updates on submission."),
    
    # Week 7
    ("Integrated the Open-Meteo API to fetch real-time weather data for project locations.", "Added live weather conditions to logs."),
    ("Built a weather widget in the Dashboard and added CSS variable theming.", "Optimized widget performance."),
    ("Conducted full end-to-end testing of the application flow from login to project creation.", "Identified and fixed minor bugs."),
    ("Prepared the application for production build and optimized assets.", "Vite build successful without errors."),
    ("Deployed the frontend to Vercel/Netlify and backend to Render/Railway.", "Deployment successful on June 19th!"),
    
    # Week 8
    ("Conducted post-deployment system optimization and addressed character encoding discrepancies.", "Ensured data integrity across modules."),
    ("Enhanced the user interface by implementing synchronized application-wide theme transitions.", "Improved user experience and visual consistency."),
    ("Refactored application styling to utilize CSS custom properties for improved rendering performance.", "Achieved optimal rendering speeds."),
    ("Optimized responsive design elements and media assets for varying mobile viewports.", "Ensured cross-device compatibility."),
    ("Fine-tuned global animation parameters to ensure a consistent and responsive user experience.", "Enhanced overall application performance."),
    
    # Week 9
    ("Updated primary media assets and graphical elements to align with final branding requirements.", "Finalized visual presentation."),
    ("Conducted comprehensive UI layout review and resolved pixel-level alignment inconsistencies.", "Achieved high-fidelity UI design."),
    ("Prepared comprehensive technical documentation and system architecture overviews.", "Documented architecture and API routes."),
    ("Conducted a final system review and prepared project deliverables for evaluation.", "Received positive feedback during review."),
    ("Completed final project submission and concluded the internship program.", "Successfully completed the internship.")
]

while len(tasks) < len(work_days):
    tasks.append(("Continued performance optimizations and documentation.", "Maintained code quality."))

# --- HTML TEMPLATES ---
html_head = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{title}</title>
<style>
    body {{ font-family: 'Times New Roman', Times, serif; color: #000; font-size: 14px; line-height: 1.5; max-width: 650px; margin: 40px auto; }}
    .page-break {{ page-break-after: always; }}
    table {{ width: 100%; border-collapse: collapse; margin-bottom: 20px; }}
    th, td {{ border: 1px solid #000; padding: 6px 10px; text-align: left; vertical-align: middle; }}
    .center {{ text-align: center; }}
    .bold {{ font-weight: bold; }}
    .logo-container {{ text-align: center; padding: 10px 0; }}
    .logo-container img {{ height: 80px; object-fit: contain; }}
    h2, h3 {{ text-align: center; margin: 4px 0; }}
    ul {{ margin: 0; padding-left: 20px; }}
    .signature-section {{ width: 100%; border: none; margin-top: 50px; }}
    .signature-section td {{ border: none; text-align: center; vertical-align: bottom; width: 50%; padding: 20px; }}
    .signature-text {{ font-weight: bold; margin-bottom: 40px; }}
</style>
</head>
<body>
"""

html_tail = """
</body>
</html>
"""

def get_header_row(title_text):
    # This row exactly mimics the grey header cell in the screenshot
    return f"""
    <tr>
        <td colspan="3" class="center" style="background-color: #d9d9d9; padding: 15px;">
            <div class="logo-container">
                <img src="C:/Users/Hemanshu/OneDrive/Desktop/LOGO College.png" alt="NIRMA UNIVERSITY">
            </div>
            <h2 class="bold" style="font-size: 18px;">NIRMA UNIVERSITY</h2>
            <h3 class="bold" style="font-size: 16px;">Institute of Technology</h3>
            <h3 class="bold" style="font-size: 16px;">3FT901CC24</h3>
            <h3 class="bold" style="font-size: 16px;">Summer Internship</h3>
        </td>
    </tr>
    <tr>
        <td colspan="3" class="center bold" style="background-color: #d9d9d9; font-size: 16px;">
            {title_text}
        </td>
    </tr>
    """

def generate_daily_report():
    html = html_head.format(title="Daily Report")
    
    # Cover Page
    html += f"""
    <table>
        {get_header_row("Internship Information")}
        <tr>
            <td class="bold" style="width: 25%;">Department</td>
            <td class="center" style="width: 2%;">:</td>
            <td>B.Tech - Computer Science and Engineering</td>
        </tr>
        <tr>
            <td class="bold">Roll no.</td>
            <td class="center">:</td>
            <td>23BCE127</td>
        </tr>
        <tr>
            <td class="bold">Name of Student</td>
            <td class="center">:</td>
            <td>Kacha Hemanshu Rameshbhai</td>
        </tr>
        <tr>
            <td class="bold">Starting Date of<br>Internship</td>
            <td class="center">:</td>
            <td>04/05/2026</td>
        </tr>
        <tr>
            <td class="bold">Ending Date of<br>Internship</td>
            <td class="center">:</td>
            <td>04/07/2026</td>
        </tr>
        <tr>
            <td class="bold">Name of<br>Industry/Organization</td>
            <td class="center">:</td>
            <td>3Martians Infotech</td>
        </tr>
        <tr>
            <td class="bold">Address of<br>Industry/Organization</td>
            <td class="center">:</td>
            <td>VIP Circle, Uttran, Surat, Gujarat</td>
        </tr>
        <tr>
            <td class="bold">Name of the external<br>guide</td>
            <td class="center">:</td>
            <td>Divyesh Khunt</td>
        </tr>
        <tr>
            <td class="bold">Contact details of<br>external guide</td>
            <td class="center">:</td>
            <td>Mobile no. : +91 8141705627<br>Email id. : threemartianssolutions@gmail.com</td>
        </tr>
        <tr>
            <td class="bold">Name of the internal<br>guide</td>
            <td class="center">:</td>
            <td>Vivek Prasad</td>
        </tr>
    </table>
    <p style="font-size: 12px; font-weight: bold; margin-top: 30px;">Note: To be filled by the student on daily basis and submitted during the final evaluation</p>
    <div class="page-break"></div>
    """
    
    # Daily Pages (2 days per page)
    for i in range(len(work_days)):
        day = work_days[i]
        task_desc, remark = tasks[i]
        
        html += f"""
        <table>
            {get_header_row("Daily Report")}
            <tr>
                <td class="bold" style="width: 25%;">Date</td>
                <td class="center" style="width: 2%;">:</td>
                <td>{day.strftime('%d/%m/%Y')}</td>
            </tr>
            <tr>
                <td class="bold">In Time</td>
                <td class="center">:</td>
                <td>10:00AM</td>
            </tr>
            <tr>
                <td class="bold">Out Time</td>
                <td class="center">:</td>
                <td>5:00PM</td>
            </tr>
            <tr>
                <td class="bold" style="height: 100px; vertical-align: top;">Details of work done for<br>the day</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;">{task_desc}</td>
            </tr>
            <tr>
                <td class="bold" style="height: 60px; vertical-align: top;">Remarks (if any)</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;">{remark}</td>
            </tr>
        </table>
        <div style="text-align: right; font-weight: bold; margin-top: 10px; margin-bottom: 40px; padding-right: 20px;">
            <p>Student Signature</p><br><p>_________________</p>
        </div>
        """
        
        if i % 2 == 1 and i != len(work_days)-1:
            html += '<div class="page-break"></div>'
            
    html += html_tail
    with open("Sitelog_Daily_Report.html", "w") as f:
        f.write(html)


def generate_weekly_report():
    html = html_head.format(title="Weekly Report")
    
    weeks = []
    current_week = []
    for day in work_days:
        current_week.append(day)
        if day.weekday() == 4: # Friday
            weeks.append(current_week)
            current_week = []
    if current_week:
        weeks.append(current_week)
        
    for w_idx, week in enumerate(weeks):
        start_w = week[0].strftime("%d/%m/%Y")
        end_w = week[-1].strftime("%d/%m/%Y")
        
        start_idx = w_idx * 5
        week_tasks = tasks[start_idx:start_idx+len(week)]
        task_bullets = "".join([f"<li>{t[0]}</li>" for t in week_tasks])
        learning_bullets = "".join([f"<li>{t[1]}</li>" for t in week_tasks[:3]])
        
        html += f"""
        <p style="font-size: 12px; font-weight: bold; margin-bottom: 10px;">Note: To be filled by the student on weekly basis and submitted during the final evaluation</p>
        <table>
            {get_header_row("Weekly Report")}
            <tr>
                <td class="bold" style="width: 25%;">Department</td>
                <td class="center" style="width: 2%;">:</td>
                <td>Computer Science and Engineering</td>
            </tr>
            <tr>
                <td class="bold">Roll no.</td>
                <td class="center">:</td>
                <td>23BCE127</td>
            </tr>
            <tr>
                <td class="bold">Name of Student</td>
                <td class="center">:</td>
                <td>Kacha Hemanshu Rameshbhai</td>
            </tr>
            <tr>
                <td class="bold">Name of<br>Industry/Organization</td>
                <td class="center">:</td>
                <td>3Martians Infotech</td>
            </tr>
            <tr>
                <td colspan="3" class="center bold" style="background-color: #f2f2f2; font-size: 15px;">
                    Week: {start_w} to {end_w} (Week no-{w_idx+1})
                </td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top;">Activities carried out</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"><ul>{task_bullets}</ul></td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top;">Subjects refereed back<br>for the present work</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"><ul><li>Official Technical Documentation</li><li>GitHub and StackOverflow</li></ul></td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top;">Technical Challenges<br>observed and its remedy</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"><ul><li>Faced implementation bugs during integration.</li><li>Solved through debugging and consulting mentor.</li></ul></td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top;">Persons interacted with<br>including internal<br>guide/external<br>guide/other company<br>officials</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"><br>Divyesh Khunt ( External guide )<br><br></td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top;">Remarkable<br>Contribution (if any)</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"></td>
            </tr>
            <tr>
                <td class="bold" style="vertical-align: top; height: 120px;">Learning outcome</td>
                <td class="center" style="vertical-align: top;">:</td>
                <td style="vertical-align: top;"><ul>{learning_bullets}</ul></td>
            </tr>
        </table>
        
        <table class="signature-section">
            <tr>
                <td style="text-align: left;">
                    <div class="signature-text">Student Signature</div>
                    <p>___________________</p>
                </td>
                <td style="text-align: left; padding-left: 20%;">
                    <div class="signature-text">Industry/Organization Guide<br>Name and Signature</div>
                    <p class="bold">Divyesh Khunt</p>
                    <p>___________________</p>
                </td>
            </tr>
        </table>
        <div class="page-break"></div>
        """
        
    html += html_tail
    with open("Sitelog_Weekly_Report.html", "w") as f:
        f.write(html)


def generate_overall_report():
    html = html_head.format(title="Overall Project Report")
    
    html += """
    <div style="text-align:center; padding-top: 100px;">
        <h1 style="font-size: 2.5em; margin-bottom: 50px;">Plinth-HQ: Construction Site Management System</h1>
        <h3 style="font-weight: normal;">Submitted By</h3>
        <h3>Kacha Hemanshu Rameshbhai</h3>
        <h3>23BCE127</h3>
        
        <div style="margin: 80px 0;">
            <div style="display:inline-block; border: 1px solid #000; padding: 20px 40px; background-color: #d9d9d9;">
                <img src="C:/Users/Hemanshu/OneDrive/Desktop/LOGO College.png" alt="NIRMA UNIVERSITY" style="height: 100px;">
                <h2 style="margin: 10px 0;">NIRMA UNIVERSITY</h2>
                <h3 style="margin: 10px 0;">INSTITUTE OF TECHNOLOGY</h3>
            </div>
        </div>
        
        <h3 style="font-weight: bold;">DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING</h3>
        <h3 style="font-weight: bold;">SCHOOL OF TECHNOLOGY</h3>
        <h3 style="font-weight: bold;">AHMEDABAD-382481</h3>
        <h3 style="margin-top: 40px;">July 2026</h3>
    </div>
    
    <div class="page-break"></div>
    
    <h2 style="text-align: center; margin-bottom: 40px;">Certificate</h2>
    <p style="line-height: 2; text-align: justify;">This is to certify that the minor project entitled <strong>"Plinth-HQ: Construction Site Management System"</strong> submitted by <strong>Kacha Hemanshu Rameshbhai (23BCE127)</strong>, towards the partial fulfilment of the requirements for the award of the degree of B. Tech in <strong>Computer Science and Engineering</strong>, Nirma University, Ahmedabad, is the record of work carried out by him under my supervision and guidance. In my opinion, the submitted work has reached the level required for being accepted for examination. The results embodied in this minor project, to the best of my knowledge, haven't been submitted to any other university or institution for the award of any degree or diploma.</p>
    
    <div style="margin-top: 100px;">
        <p><strong>Prof. Vivek Prasad</strong><br>CSE Department,<br>Institute of Technology,<br>Nirma University, Ahmedabad.</p>
    </div>
    <div style="margin-top: 50px;">
        <p><strong>Dr Sudeep Tanwar</strong><br>Professor and Head,<br>CSE Department,<br>Institute of Technology,<br>Nirma University, Ahmedabad.</p>
    </div>
    
    <div class="page-break"></div>
    
    <h2 style="text-align: center; margin-bottom: 40px;">ACKNOWLEDGEMENT</h2>
    <p style="line-height: 2; text-align: justify;">It gives us great pleasure to present our project on "Plinth-HQ: Construction Site Management System."</p>
    <p style="line-height: 2; text-align: justify;">First, we want to express our sincere gratitude to <strong>3Martians Infotech</strong> and my mentor <strong>Mr. Divyesh Khunt</strong>. His guidance, suggestions, and constant support were key in shaping this project. His valuable insights on system design and technical implementation were critical throughout the development process.</p>
    <p style="line-height: 2; text-align: justify;">We also want to thank Assistant <strong>Professor Vivek Prasad</strong> for his academic supervision and encouragement. He provided direction and motivation at every step.</p>
    <p style="line-height: 2; text-align: justify;">A special thanks goes to our fellow batch-mates and friends. Their discussions, cooperation, and feedback helped us overcome various challenges during development and inspired us to push harder.</p>
    
    <div style="text-align: right; margin-top: 60px;">
        <p>Yours Thankfully</p>
        <p><strong>Kacha Hemanshu Rameshbhai</strong></p>
    </div>
    
    <div class="page-break"></div>
    
    <h2 style="text-align: center; margin-bottom: 40px;">ABSTRACT</h2>
    <p style="line-height: 2; text-align: justify;">This project presents a web-based Construction Site Management System (Plinth-HQ) that aims to simplify project tracking, budget management, and real-time site logging. It uses the MERN (MongoDB, Express.js, React.js, Node.js) stack. The platform allows project managers and site engineers to track active sites, log daily material usage, monitor weather conditions, and manage project expenses dynamically.</p>
    <p style="line-height: 2; text-align: justify;">The system features a robust dashboard for tracking total budgets versus spent percentages, a voice-input enabled daily logging interface for easy data entry by engineers on the field, and integrated weather APIs to contextualize construction progress against environmental factors. The system also has secure authentication and role-based access through JWT.</p>
    <p style="line-height: 2; text-align: justify;">Technologies like Tailwind CSS and React Context API improve UI responsiveness and state management. The backend efficiently manages RESTful APIs, JWT authentication, and database operations. The project successfully deployed on June 19th and includes advanced features such as real-time CSS variable-driven theme switching for a buttery smooth user experience.</p>
    <p style="line-height: 2; text-align: justify;">This project aims to close the digital gap in the construction sector by promoting transparency and simplifying operations between site engineers and project managers.</p>
    """
    
    html += html_tail
    with open("Sitelog_Overall_Report.html", "w") as f:
        f.write(html)

generate_daily_report()
generate_weekly_report()
generate_overall_report()
print("Reports generated perfectly to spec!")
