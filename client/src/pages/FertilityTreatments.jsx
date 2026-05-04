import './FertilityTreatments.css';
import Footer from '../components/Footer';
import logo from '../assets/fertility-treatments/logo.png';
import heroImage from '../assets/fertility-treatments/hero-ivf.png';
import phoneIcon from '../assets/fertility-treatments/phone.png';
import step1 from '../assets/fertility-treatments/step-1.svg';
import step2 from '../assets/fertility-treatments/step-2.svg';
import step3 from '../assets/fertility-treatments/step-3.svg';
import step4 from '../assets/fertility-treatments/step-4.svg';
import step5 from '../assets/fertility-treatments/step-5.svg';
import chevron from '../assets/fertility-treatments/chevron.png';

const journeySteps = [
  {
    label: 'STEP 01',
    title: 'Ovarian Stimulation',
    text: 'Medication to encourage ovaries to produce multiple mature eggs for retrieval.',
    icon: step1,
  },
  {
    label: 'STEP 02',
    title: 'Egg Retrieval',
    text: 'A minor surgical procedure to collect mature eggs using ultrasound guidance.',
    icon: step2,
  },
  {
    label: 'STEP 03',
    title: 'Fertilization',
    text: 'Sperm and eggs are combined in our lab to create viable embryos.',
    icon: step3,
  },
  {
    label: 'STEP 04',
    title: 'Embryo Culture',
    text: 'Monitoring embryos as they grow for 3-5 days in our protected incubators.',
    icon: step4,
  },
  {
    label: 'STEP 05',
    title: 'Embryo Transfer',
    text: 'The final step: placing the selected embryo into the uterus for pregnancy.',
    icon: step5,
  },
];

const timeline = [
  ['Initial Consultation', 'The physician reviews your medical history and prepares a treatment plan.'],
  ['Ovarian Stimulation', 'Hormone injections are taken for around 10 to 12 days to stimulate egg growth.'],
  ['Egg Retrieval', 'A brief minimally invasive procedure collects mature eggs under light sedation.'],
  ['Embryo Culture', 'Embryos are monitored in the lab as they develop for 3 to 5 days.'],
  ['Transfer & Pregnancy Test', 'A selected embryo is transferred, followed by a pregnancy test after two weeks.'],
];

const faqs = [
  {
    question: 'Is the egg retrieval procedure painful?',
    answer: 'No, the procedure is performed under light sedation. You will be asleep and comfortable. Most patients experience mild cramping similar to a period afterwards, which resolves within 24 hours.',
    open: true,
  },
  {
    question: 'How long is the recovery period?',
    answer: '',
  },
  {
    question: 'What are the side effects of IVF medications?',
    answer: '',
  },
];

export default function FertilityTreatments() {
  return (
    <div className="fertility-page" data-node-id="130:2203">
      <header className="fertility-header" data-node-id="130:2408">
        <div className="fertility-header__canvas">
          <img className="fertility-header__logo" src={logo} alt="Mythri Fertinest" />
          <nav className="fertility-header__nav" aria-label="Primary">
            <a href="#services">Services</a>
            <a href="#locations">Locations</a>
            <a href="#about">About Us</a>
            <a href="#resources">Resources</a>
          </nav>
          <a className="fertility-header__call" href="tel:+919182039911">
            <img src={phoneIcon} alt="" aria-hidden="true" />
            <span>9182039911</span>
          </a>
        </div>
      </header>

      <section className="fertility-hero">
        <div className="fertility-hero__canvas">
          <img src={heroImage} alt="" aria-hidden="true" />
          <div className="fertility-hero__overlay" aria-hidden="true" />
          <div className="fertility-hero__copy">
            <h1>IVF / Test Tube Baby</h1>
            <p>
              No matter how long you have been trying, we help you move toward parenthood with clarity,
              precision, and care.
            </p>
          </div>
        </div>
      </section>

      <section className="fertility-info" id="services">
        <span className="fertility-anchor" id="about" aria-hidden="true" />
        <div className="fertility-container">
          <h2>What is IVF?</h2>
          <p>
            In-Vitro Fertilization (IVF) is the process where an egg is fertilized by sperm outside
            the body, in a specialized laboratory environment. It is the most effective form of
            assisted reproductive technology available today.
          </p>
          <p>
            At Fertinest, we go beyond the standard procedure by utilizing AI-driven embryo selection
            and time-lapse monitoring to maximize the potential of every cycle. Our laboratory is
            designed to mimic the natural environment of the womb as closely as possible.
          </p>

          <aside className="fertility-fit-card">
            <h3>Is IVF right for you?</h3>
            <ul>
              <li>Advanced maternal age, typically over 35</li>
              <li>Endometriosis or blocked fallopian tubes</li>
              <li>Unexplained infertility lasting over 12 months</li>
              <li>Male factor infertility requiring ICSI</li>
              <li>Genetic carrier screening requirements</li>
            </ul>
          </aside>
        </div>
      </section>

      <section className="fertility-journey">
        <div className="fertility-container">
          <h2>The IVF Journey</h2>
          <p>Five dedicated stages designed for safety, precision, and the highest success potential.</p>
          <div className="fertility-steps">
            {journeySteps.map(step => (
              <article className="fertility-step" key={step.label}>
                <div className="fertility-step__icon">
                  <img src={step.icon} alt="" aria-hidden="true" />
                </div>
                <div className="fertility-step__card">
                  <span>{step.label}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="fertility-timeline">
        <div className="fertility-container">
          <h2>IVF Timeline at Fertinest - What to Expect</h2>
          <p>
            For many working couples, understanding the time involved in IVF is important. At
            Fertinest, we follow a structured and patient-friendly approach designed to fit into your
            routine.
          </p>
          <ol>
            {timeline.map(([title, text]) => (
              <li key={title}>
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="fertility-faq">
        <div className="fertility-container">
          <h2>Common Questions</h2>
          <div className="fertility-faq__list">
            {faqs.map(faq => (
              <article className="fertility-faq__item" key={faq.question}>
                <button type="button">
                  <span>{faq.question}</span>
                  <img src={chevron} alt="" aria-hidden="true" />
                </button>
                {faq.open && <p>{faq.answer}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
