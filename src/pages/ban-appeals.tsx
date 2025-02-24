import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function BanAppeal() {
    const { data: session, status } = useSession();
    const [banData, setBanData] = useState(null);
    const [userData, setUserData] = useState(null);
    const [appealData, setAppealData] = useState(null);
    const [form, setForm] = useState({
        reason: '',
        solution: '',
        future: '',
        extra: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            fetchBanStatus();
            if (!userData) fetchUserData();
        }
        if (userData) {
            fetchExistingAppeals();
        }
    }, [session, status, userData]);
    
    async function fetchBanStatus() {
        const res = await fetch(`http://localhost:3024/api/v2/discord/bans/${session?.user.id}`, {
            headers: { 'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_DB_API_USERNAME}:${process.env.NEXT_PUBLIC_DB_API_PASSWORD}`)}` }
        });
        if (res.status === 200 || res.status === 304) {
            const data = await res.json();
            setBanData(data);
        } else {
            setBanData(null);
        }
    }

    async function fetchUserData() {
        const res = await fetch(`http://localhost:3024/api/v2/users/${session?.user.id}`, {
            headers: { 'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_DB_API_USERNAME}:${process.env.NEXT_PUBLIC_DB_API_PASSWORD}`)}` }
        });
        if (res.status === 200 || res.status === 304) {
            const data = await res.json();
            setUserData(data);
        } else {
            setUserData(null);
        }
    }
    
    async function fetchExistingAppeals() {
        const res = await fetch(`http://localhost:3024/api/v2/appeals/${userData.id}/latest`, {
            headers: { 'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_DB_API_USERNAME}:${process.env.NEXT_PUBLIC_DB_API_PASSWORD}`)}` }
        });
        if (res.status === 200 || res.status === 304) {
            const appealData = await res.json();
            setAppealData(appealData || null);
        }
    }
    
    async function submitAppeal() {
        setIsSubmitting(true);
        const userRes = await fetch(`http://localhost:3024/api/v2/users/${session?.user.id}`, {
            headers: { 'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_DB_API_USERNAME}:${process.env.NEXT_PUBLIC_DB_API_PASSWORD}`)}` }
        });
        
        if (userRes.status !== 200 && userRes.status !== 304) return;
        const userData = await userRes.json();

        if (!banData) {
            throw new Error('Ban data does not exist. How are we submitting an appeal then? :(')
        }
        
        const appealPayload = {
            newAppealData: {
                guild: '960606557622657026',
                userId: banData.user.id,
                username: banData.user.username,
                discriminator: banData.user.discriminator,
                avatar: banData.user.avatar,
                reason: form.reason,
                solution: form.solution,
                future: form.future,
                extra: form.extra,
                email: session.user.email || ''
            }
        };
        
        const appealRes = await fetch(`http://localhost:3024/api/v2/appeals/${userData.id}/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${process.env.NEXT_PUBLIC_DB_API_USERNAME}:${process.env.NEXT_PUBLIC_DB_API_PASSWORD}`)}`
            },
            body: JSON.stringify(appealPayload)
        });
        
        if (appealRes.status === 200 || appealRes.status === 304) {
            setAppealData({ status: 'Pending review' });
        }
        setIsSubmitting(false);
    }
    
    if (status === 'loading') return <p>Loading...</p>;
    if (!session) return <button onClick={() => signIn('discord')}>Login with Discord</button>;
    
    if (!banData) return <p>Hey, you're not banned!</p>;
    
    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-900 text-white rounded-lg shadow-lg border border-gray-700">
            <div className="flex items-center space-x-4 p-2 bg-blue-500">
                {/* Profile Image */}
                <img className='flex-auto'
                    src={session.user.image!} 
                    alt="User Avatar" 
                    style={{
                        width: '50px', 
                        height: '50px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                    }} 
                />
                {/* Username Text */}
                <p className="text-sm flex-auto">Logged in as: @{session.user.username}</p>
            </div>
    
            <h1 className="text-3xl font-bold text-center mb-4 text-blue-400">Ban Appeal</h1>
            <p className="mb-4 text-lg text-center"><strong>Ban Reason:</strong> {banData.reason}</p>
    
            {appealData ? (
                <p className="text-yellow-400 text-center">Your appeal is pending review.</p>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); submitAppeal(); setIsSubmitting(true); }} className="space-y-4">
                    <div className="text-center">
                        <label className="block text-sm font-semibold mb-1">Do you know why you were banned? (Required)</label>
                        <textarea required className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}></textarea>
                    </div>
                    
                    <div className="text-center">
                        <label className="block text-sm font-semibold mb-1">Have you taken any steps to rectify the situation?</label>
                        <textarea className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500" value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })}></textarea>
                    </div>
                    
                    <div className="text-center">
                        <label className="block text-sm font-semibold mb-1">What steps will you take to ensure it doesn't happen again?</label>
                        <textarea className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500" value={form.future} onChange={(e) => setForm({ ...form, future: e.target.value })}></textarea>
                    </div>
                    
                    <div className="text-center">
                        <label className="block text-sm font-semibold mb-1">Anything else to add? (Optional)</label>
                        <textarea className="w-full p-2 rounded bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500" value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })}></textarea>
                    </div>
                    
                    {/* Centered Submit Button */}
                    <div className="text-center">
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:bg-gray-600">
                            {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
    
}
