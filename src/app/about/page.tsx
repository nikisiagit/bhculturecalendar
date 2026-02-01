import Link from "next/link";
import Image from "next/image";
import { getEvents } from "@/lib/notion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default async function AboutPage() {
    const events = await getEvents();

    return (
        <>
            {/* Header */}
            <Header events={events} />

            {/* Main Content */}
            <main className="main about-page">
                <h1 className="visually-hidden">About BH Culture Calendar</h1>
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
                                are culturally confident passionate supporters of arts and culture. Likely attend whatever’s on, whenever available
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>FAMILIAR FACES</h3>
                            <p>
                                are culturally confident supporters of the sector. More discerning when choosing events to attend, possibly due to limited time available
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>SOCIAL BUTTERFLIES</h3>
                            <p>
                                keep an eye out for things to do with friends and family. May or may not be familiar with cultural events but want a good experience
                            </p>
                        </div>
                        <div className="audience-card">
                            <h3>TOE DIPPERS</h3>
                            <p>
                                are less culturally confident but want to test the water. May not have attended an event of the type before…..but willing to give things a go
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            {/* Footer */}
            <Footer />
        </>
    );
}
