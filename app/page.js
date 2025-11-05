"use client";

import React, { useState } from 'react';
import Login from '@/components/auth/login';
import "./globals.css";

export default function Home() {

  const [showLogin, setShowLogin] = useState(false);
  const handleToggleLogin = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div className="page">
      <div className="topContent">
        <button onClick={handleToggleLogin}>
          {showLogin ? "Скрыть форму входа" : "Показать форму входа"}
        </button>
      </div>
      <div className="centerContent">
        {showLogin && <Login 
        onToggleVisibility={handleToggleLogin} 
        isCurrentlyVisible={showLogin}/>}
      </div>
    </div>
    
  );
}