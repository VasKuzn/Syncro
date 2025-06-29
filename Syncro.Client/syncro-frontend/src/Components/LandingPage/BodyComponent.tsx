import React from "react";
import { useNavigate } from "react-router-dom";

const BodyComponent = () => {

    const navigate = useNavigate();
    return (
        <section className="landing-main">
            <h1>STAY SYNCHRONIZED<br />WITH YOUR BUDDIES</h1>
            <p>
                Syncro is a great place to meet up with friends or just to create a global
                community &#129315; Make your own space for conversations! Games! Hobbies!
            </p>
            <button className="primary-button" onClick={() => navigate("/login")}>
                Open Syncro in a browser
            </button>
        </section>
    );
};

export default BodyComponent;
