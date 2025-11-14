"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "../../components/layout/MainLayout";
import MainPage from "@/components/main/MainPage";
import UserProfile from "../../app/session/UserProfile";

export default function main() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const email = UserProfile.getEmail();
                if (!email) {
                    router.push('/login');
                    return;
                }

                const res = await fetch('/api/auth/check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const authData = await res.json();

                if (!authData.authenticated) {
                    router.push('/login');
                    return;
                }

                if (!authData.hasGroup) {
                    router.push('/join');
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    if (isAuthorized === null) {
        return <div>Loading...</div>;
    }

    return ( 
        <MainLayout>
            <MainPage/>
        </MainLayout>
    )
}

