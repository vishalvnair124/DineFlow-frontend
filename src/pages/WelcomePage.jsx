import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChefHat, Clock3, Heart, QrCode, Star, Utensils, User } from 'lucide-react';
import api from '../api';
import './WelcomePage.css';

const WelcomePage = () => {
  const [searchParams] = useSearchParams();
  const tableToken = searchParams.get('table');
  const [tableName, setTableName] = useState('');
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    const verifyTable = async () => {
      if (tableToken) {
        try {
          const res = await api.get(`/tables/scan/${tableToken}`);
          localStorage.setItem('currentTableId', res.data.id);
          setTableName(res.data.tableNumber);
        } catch {
          console.warn('Invalid table token from QR code.');
        }
      }
    };

    verifyTable();
  }, [tableToken]);

  useEffect(() => {
    const revealItems = document.querySelectorAll('.welcome-reveal');
    const page = document.querySelector('.welcome-page');

    if (!page || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return undefined;
    }

    page.classList.add('welcome-reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -35px 0px' });

    revealItems.forEach((item) => observer.observe(item));

    return () => {
      observer.disconnect();
      page.classList.remove('welcome-reveal-ready');
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <div className="welcome-page">
      <header className="welcome-header">
        <Link className="welcome-brand" to="/" aria-label="DineFlow home">
          <span className="welcome-brand-icon"><Utensils size={19} /></span>
          <span>Dine<span>Flow</span></span>
        </Link>

        <div className="welcome-header-actions">
          <span className="welcome-header-note">Good food, good mood.</span>
          {isLoggedIn ? (
            <button className="welcome-login" onClick={handleLogout}>Logout</button>
          ) : (
            <Link className="welcome-login" to="/login">
              <User size={16} /> <span>Login</span>
            </Link>
          )}
        </div>
      </header>

      <main>
        <section className="welcome-hero">
          <div className="welcome-copy">
            <div className="welcome-eyebrow">
              <span className="welcome-eyebrow-dot" />
              YOUR TABLE IS WAITING
            </div>

            <h1>
              A little more<br />
              <span>delicious.</span>
            </h1>

            <p className="welcome-description">
              Freshly made, thoughtfully served, and just a few taps away. Find your new
              favorite and make this meal a good one.
            </p>

            {tableName && (
              <div className="welcome-table-note">
                <span className="welcome-eyebrow-dot" />
                You&apos;re seated at <strong>Table {tableName}</strong>
              </div>
            )}

            <div className="welcome-actions">
              <Link className="welcome-order-button" to="/menu">
                Explore the menu <ArrowRight size={19} />
              </Link>
              <span className="welcome-action-caption">Made fresh. Ordered easy.</span>
            </div>

            <div className="welcome-perks">
              <div className="welcome-perk">
                <span className="welcome-perk-icon"><Star size={16} /></span>
                <span><strong>Made with care</strong><small>Fresh ingredients, always</small></span>
              </div>
              <div className="welcome-perk">
                <span className="welcome-perk-icon"><Clock3 size={16} /></span>
                <span><strong>Easy ordering</strong><small>Your favorites, a few taps away</small></span>
              </div>
            </div>
          </div>

          <section className="welcome-visual" aria-label="A freshly prepared meal">
            <img
              className="welcome-food-image"
              src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=85"
              alt="A colorful, freshly prepared meal"
            />
            <div className="welcome-image-shade" />
            <div className="welcome-image-label">
              <span className="welcome-image-label-icon"><Utensils size={17} /></span>
              <span><strong>Something delicious</strong><small>is right around the corner</small></span>
              <ArrowUpRight className="welcome-image-arrow" size={19} />
            </div>
            <div className="welcome-image-stamp" aria-hidden="true">
              <span>GOOD</span>
              <Star size={17} fill="currentColor" />
              <span>FOOD</span>
            </div>
          </section>
        </section>

        <section className="welcome-menu-section">
          <div className="welcome-section-heading welcome-reveal">
            <div>
              <div className="welcome-eyebrow"><span className="welcome-eyebrow-dot" />A TASTE OF WHAT'S GOOD</div>
              <h2>Made for your <span>next favorite.</span></h2>
            </div>
            <p>Whether you're keeping it light or leaning into comfort, there's something worth slowing down for.</p>
          </div>

          <div className="welcome-food-grid">
            <article className="welcome-food-card welcome-reveal">
              <div className="welcome-food-card-image">
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85" alt="A fresh salad with colorful seasonal ingredients" loading="lazy" />
                <span className="welcome-food-card-tag">FRESH & BRIGHT</span>
              </div>
              <div className="welcome-food-card-copy">
                <span className="welcome-food-card-icon"><Heart size={17} /></span>
                <h3>A little something fresh</h3>
                <p>Bright flavors and feel-good ingredients to make your day.</p>
              </div>
            </article>
            <article className="welcome-food-card welcome-reveal">
              <div className="welcome-food-card-image">
                <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85" alt="A delicious bowl prepared with fresh ingredients" loading="lazy" />
                <span className="welcome-food-card-tag">MADE WITH CARE</span>
              </div>
              <div className="welcome-food-card-copy">
                <span className="welcome-food-card-icon"><ChefHat size={17} /></span>
                <h3>Comfort, made delicious</h3>
                <p>Familiar favorites, thoughtfully prepared and ready to enjoy.</p>
              </div>
            </article>
            <article className="welcome-food-card welcome-reveal">
              <div className="welcome-food-card-image">
                <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=85" alt="A table-ready dish full of fresh ingredients" loading="lazy" />
                <span className="welcome-food-card-tag">GOOD TO SHARE</span>
              </div>
              <div className="welcome-food-card-copy">
                <span className="welcome-food-card-icon"><Utensils size={17} /></span>
                <h3>Bring everyone together</h3>
                <p>Make room at the table for one more bite and one more story.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="welcome-how-section">
          <div className="welcome-how-intro welcome-reveal">
            <div className="welcome-eyebrow"><span className="welcome-eyebrow-dot" />GOOD FOOD, NO FUSS</div>
            <h2>Your next great meal is <span>three steps away.</span></h2>
            <p>Less waiting around, more enjoying the moment. Ordering something lovely couldn't be easier.</p>
            <Link className="welcome-text-link" to="/menu">Take a look at the menu <ArrowRight size={17} /></Link>
          </div>

          <div className="welcome-steps">
            <article className="welcome-step welcome-reveal">
              <span className="welcome-step-number">01</span>
              <span className="welcome-step-icon"><Utensils size={21} /></span>
              <h3>Find your craving</h3>
              <p>Browse the menu and discover something made for you.</p>
            </article>
            <article className="welcome-step welcome-reveal">
              <span className="welcome-step-number">02</span>
              <span className="welcome-step-icon"><QrCode size={21} /></span>
              <h3>Place your order</h3>
              <p>Choose your favorites and send your order in a few taps.</p>
            </article>
            <article className="welcome-step welcome-reveal">
              <span className="welcome-step-number">03</span>
              <span className="welcome-step-icon"><Heart size={21} /></span>
              <h3>Enjoy every bite</h3>
              <p>Settle in, relax, and let the good part begin.</p>
            </article>
          </div>
        </section>

        <section className="welcome-cta-section welcome-reveal">
          <div className="welcome-cta-copy">
            <span className="welcome-cta-kicker">A GOOD MEAL STARTS HERE</span>
            <h2>Hungry yet?</h2>
            <p>Your table is ready. Let's find something you'll love.</p>
          </div>
          <Link className="welcome-cta-button" to="/menu">Browse the menu <ArrowRight size={19} /></Link>
          <span className="welcome-cta-decoration" aria-hidden="true"><Star size={22} fill="currentColor" /></span>
        </section>
      </main>

      <footer className="welcome-footer">
        <div className="welcome-footer-inner">
          <div className="welcome-footer-main">
            <div className="welcome-footer-brand-block">
              <Link className="welcome-brand welcome-footer-brand" to="/" aria-label="DineFlow home">
                <span className="welcome-brand-icon"><Utensils size={19} /></span>
                <span>Dine<span>Flow</span></span>
              </Link>
              <p>Good food tastes even better when you slow down and enjoy it together.</p>
            </div>

            <div className="welcome-footer-links">
              <h2>Explore</h2>
              <Link to="/menu">Our menu</Link>
              <Link to="/login">Your account</Link>
            </div>

            <div className="welcome-footer-note">
              <span className="welcome-footer-kicker">A LITTLE NOTE</span>
              <p>Thanks for stopping by. We hope you find something you love.</p>
              <Link to="/menu">Find your next favorite <ArrowRight size={15} /></Link>
            </div>
          </div>

          <div className="welcome-footer-bottom">
            <span>© {new Date().getFullYear()} DineFlow. Made for good meals.</span>
            <span className="welcome-footer-bottom-right">GOOD THINGS ARE COOKING <Star size={13} fill="currentColor" /></span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
