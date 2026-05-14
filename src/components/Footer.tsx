export default function Footer() {
    return (
        <footer className="footer" id="footer">
            <div className="footer-content">
                <p>© 2026 BH Culture Calendar. Built by community, for community.</p>
                <div className="footer-links">
                    <a
                        href="https://sprout-4sz.pages.dev/space/bhculturecalendar"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Suggest an idea
                    </a>
                    <span className="separator">|</span>
                    <a href="mailto:bhculturecalendar@gmail.com">Contact Us</a>
                    <span className="separator">|</span>
                    <a
                        href="https://forms.gle/pZGHpZDQjVZVCNT38"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Join the team
                    </a>
                </div>
            </div>
        </footer>
    );
}
