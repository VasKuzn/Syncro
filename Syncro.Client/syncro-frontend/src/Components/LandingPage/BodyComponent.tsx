import React from "react";
import { useNavigate } from "react-router-dom";

const BodyComponent = () => {

    const navigate = useNavigate();
    return (
        <section className="main">
            <h1>STAY SYNCHRONIZED<br />WITH YOUR BUDDIES</h1>
            <p>
                Syncro is a great place to meet up with friends or create a global
                community. Create your own space for conversations, games, and hobbies.
            </p>
            <button className="login-btn" onClick={() => navigate("/login")}>
                Open Syncro in a browser
            </button>
        </section>
  );
};

export default BodyComponent;
