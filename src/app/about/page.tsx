import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
    return (
        <>
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <Link href="/" className="logo-link">
                        <Image
                            src="/logo.png"
                            alt="Culture Calendar"
                            width={300}
                            height={60}
                            className="logo-image"
                            priority
                        />
                    </Link>

                    <nav className="nav">
                        <Link href="/" className="nav-link">
                            WHAT&apos;S ON
                        </Link>
                        <Link href="/venues" className="nav-link">
                            VENUES
                        </Link>
                        <Link href="/about" className="nav-link active">
                            ABOUT
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="main about-page">
                {/* Rotating Graphic */}
                <div className="rotating-graphic-container">
                    <Image
                        src="/logo-graphic.png"
                        alt="Arts Categories"
                        width={400}
                        height={400}
                        className="rotating-graphic"
                        priority
                    />
                </div>

                {/* Vision & Mission */}
                <div className="vision-mission-grid">
                    <div className="vision-card">
                        <h2>OUR VISION</h2>
                        <p>A vibrant and healthy cultural sector in the BH postcode area.</p>
                    </div>
                    <div className="mission-card">
                        <h2>OUR MISSION</h2>
                        <p>To connect consumers and culture in the BH postcode area.</p>
                    </div>
                </div>

                {/* Our Approach */}
                <section className="content-section">
                    <h2 className="section-heading">OUR APPROACH</h2>
                    <ul className="approach-list">
                        <li>We are run by our <strong>communities</strong>, for our communities</li>
                        <li>We are all <strong>volunteers</strong></li>
                        <li>We are not perfectionists, good enough is <strong>good enough</strong></li>
                        <li>We keep it <strong>simple</strong></li>
                    </ul>
                </section>

                {/* Problem Section */}
                <section className="content-section problem-section">
                    <h2 className="section-heading">WHAT PROBLEM ARE WE SOLVING</h2>
                    <p className="problem-text">
                        People often tell us they are interested in attending cultural events locally but generally don&apos;t
                        know what&apos;s on, where or when. Our research tells us an estimated 60,000 individuals in the
                        area have an interest in cultural events. <strong>We bridge the gap.</strong>
                    </p>
                </section>

                {/* Target Audience */}
                <section className="content-section">
                    <h2 className="section-heading">WHO ARE WE SOLVING IT FOR</h2>
                    <div className="audience-grid">
                        <div className="audience-card">
                            <h3>CULTURE VULTURES</h3>
                            <p>
                                Already attend cultural events and will likely use the calendar regularly.
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>CULTURAL CONSUMERS</h3>
                            <p>
                                Familiar with attending cultural events but attend only occasionally.
                                Irregular users of the calendar, will dip in when needed.
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>SOCIALISERS</h3>
                            <p>
                                Less familiar with attending cultural events but enjoy socialising and will
                                likely use the calendar regularly to find &apos;things to do&apos;.
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>BICE DIPPERS</h3>
                            <p>
                                Less familiar with attending cultural events but attend only occasionally.
                                Irregular users of the calendar, will dip in when needed.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>© 2026 Culture Calendar. Made with ❤️ for the local community.</p>
            </footer>
        </>
    );
}
