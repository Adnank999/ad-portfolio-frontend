import { Compass, Fingerprint, HeartHandshake } from 'lucide-react'

const qualities = [
  {
    name: 'Personality',
    title: 'Practical, with an eye for detail.',
    description: 'I like understanding the whole problem, not just my corner of it. From the first screen to the background job, I care about clear decisions, maintainable code, and the details people notice when something feels right.',
    icon: Fingerprint,
  },
  {
    name: 'Curiosity',
    title: 'Always asking “what if?”',
    description: 'Working on AI image classification and virtual try-on made me curious about what software can see and create. That curiosity now takes me from backend languages to WebGL, shaders, and 3D experiments.',
    icon: Compass,
  },
  {
    name: 'Motivation',
    title: 'Build something people can trust.',
    description: 'A booking should feel clear. A payment should be accounted for. A useful tool should save someone time. Those everyday moments are what motivate me to turn complex requirements into dependable products.',
    icon: HeartHandshake,
  },
]

export function AboutHumanSide() {
  return <section id="about-human-side" className="about-showcase about-human about-container" aria-labelledby="about-human-title">
    <header className="about-showcase-heading">
      <p className="about-label">02 / The human side</p>
      <h2 id="about-human-title">Personality, curiosity<br />and <em className="accent-text-gradient">motivation.</em></h2>
      <p className="about-body">Behind the code is someone who likes connecting the dots: between a person’s needs, a product’s constraints, and an idea that could make the whole experience better.</p>
    </header>
    <div className="about-human-grid">
      {qualities.map(({ name, title, description, icon: Icon }, index) => <article key={name} className="about-human-quality">
        <div className="about-human-marker"><Icon size={25} strokeWidth={1.25} aria-hidden="true" /><p className="about-label">0{index + 1} / {name}</p></div>
        <h3>{title}</h3>
        <p className="about-body">{description}</p>
      </article>)}
    </div>
    <div className="about-human-note"><p className="about-label">What keeps me moving</p><p>Understand the problem. Own the details. <em className="accent-text-gradient">Keep getting better.</em></p></div>
  </section>
}
