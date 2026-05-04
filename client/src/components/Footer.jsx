import './Footer.css';
import fertinestLogo from '../assets/figma-footer/fertinest-logo.png';
import logoGraphic from '../assets/figma-footer/logo-graphic.png';
import phoneIcon from '../assets/figma-footer/phone.png';
import emailIcon from '../assets/figma-footer/email.png';
import divider from '../assets/figma-footer/divider.png';

const serviceLinks = [
  'Fertility Treatments',
  'Infertility Conditions',
  'Maternity & Surgical Care',
];

const locationLinks = ['Nellore', 'Ananthapur'];
const resourceLinks = ['Fertility Calculators', 'Blogs', 'About Us'];

function FooterColumn({ title, items, id }) {
  const headingId = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-heading`;

  return (
    <section id={id} className="fertinest-footer__column" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <ul>
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default function Footer() {
  return (
    <footer className="fertinest-footer" data-node-id="221:4">
      <div className="fertinest-footer__canvas">
        <section className="fertinest-footer__brand" aria-label="Mythri Fertinest contact information">
          <img className="fertinest-footer__logo" src={fertinestLogo} alt="Mythri Fertinest" />
          <h2>Contact Us</h2>
          <a className="fertinest-footer__contact" href="tel:+919182039911">
            <img src={phoneIcon} alt="" aria-hidden="true" />
            <span>+91 9182039911</span>
          </a>
          <a className="fertinest-footer__contact" href="mailto:mythrifertinest@gmail.com">
            <img src={emailIcon} alt="" aria-hidden="true" />
            <span>mythrifertinest@gmail.com</span>
          </a>
        </section>

        <div className="fertinest-footer__links">
          <FooterColumn id="footer-services" title="Services / Treatments" items={serviceLinks} />
          <FooterColumn id="locations" title="Locations" items={locationLinks} />
          <FooterColumn id="resources" title="Resources" items={resourceLinks} />
        </div>

        <div className="fertinest-footer__divider" aria-hidden="true">
          <img src={divider} alt="" />
        </div>
        <p className="fertinest-footer__copyright">
          All Rights Reserved &copy; 2026, Mythri Fertinest | Imagined and Crafted By <strong>TZYN Studio</strong>
        </p>
        <img className="fertinest-footer__graphic" src={logoGraphic} alt="" aria-hidden="true" />
      </div>
    </footer>
  );
}
