"use client";

import React, { useState } from 'react';
import Login from '@/components/auth/login';
import SignUp from '@/components/auth/singup'
import "./globals.css";

export default function Home() {

  const [showLogin, setShowLogin] = useState(false);
  const handleToggleLogin = () => {
    setShowLogin(!showLogin);
  };
  const [showSignup, setShowSignup] = useState(false);
  const handleToggleSignup = () => {
    setShowSignup(!showSignup);
  };

  return (
    <div className="page">
      <div className='MenuDiv'>
        <div className='TopContent'>
          <p>Docs Compliance</p>
        </div>
        <div className="ButContent">
          <button onClick={handleToggleLogin}>
            {showLogin ? "LogIn" : "LogIn"}
          </button>
          <button onClick={handleToggleSignup}>
            {showSignup ? "SignUp" : "SignUp"}
          </button>
        </div>
      </div>
      <div className="LogContent">
        {showLogin && <Login 
        onToggleVisibility={handleToggleLogin} 
        isCurrentlyVisible={showLogin}/>}
        {showSignup && <SignUp 
        onToggleVisibility={handleToggleSignup} 
        isCurrentlyVisible={showSignup}/>}
      </div>
    </div>
    
  );
}