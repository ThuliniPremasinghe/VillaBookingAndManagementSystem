// Footer.js
import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column">
          <h3>Links</h3>
          <ul>
            <li><Link to="/homepage">Home</Link></li>
            <li><Link to="/propertypage">All Products</Link></li>
            <li><Link to="/footer">About</Link></li>
            <li><Link to="/reviews">Gallery</Link></li>
           
          </ul>
        </div>

        <div className="footer-column">
          <h3>Info</h3>
          <ul>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/terms-and-conditions">Terms and Conditions</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Contact Us</h3>
          <ul>
            <li>+94 77 232 8333</li>
            <li>info@villathus.com</li>
            <li>
              459/2/1, Abimangama Road,<br />
              Gintota, Galle,<br />
              Sri Lanka
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>Sign up for our newsletter</h3>
          <div className="newsletter-form">
            <input type="email" placeholder="Email Address" />
            <button className="signup-btn">Sign Up</button>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2024 Villa Thus . All rights reserved</p>
      </div>
    </footer>
  );
};

export default Footer;