"use client"
// import Gstyle from "../../app/globals.css";
// import Mstyle from "../styles/group.module.css";
import style from "../../components/styles/main.module.css"
// import Link from 'next/link';
import { useState } from "react";

export default function main() {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={style.page}>
            <div className= {isOpen ? style.leftMenuOpen : style.leftMenu}>

            </div>
            <div className={style.topMenu}>
                <button 
                type="button"
                className={style.LMenuButton}
                onClick={toggleMenu}
                />
            </div>
            <div className={style.rightMenu}>

            </div>
            
        </div>
    )
}
