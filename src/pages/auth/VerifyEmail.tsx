import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { confirmSignUp, resendSignUpCode } from '../../services/authAdapter';
import { useAppStore } from '../../store/useAppStore';
import styles from './Auth.module.css';

export default function VerifyEmail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useAppStore();

    const [email] = useState(location.state?.email || '');
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!email) {
            // Need an email to verify
            addToast('Please start by signing up or logging in.', 'info');
            navigate('/login', { replace: true });
        }
    }, [email, navigate, addToast]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { isSignUpComplete } = await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            if (isSignUpComplete) {
                addToast('Email verified successfully! Please sign in.', 'success');
                navigate('/login', { replace: true });
            } else {
                addToast('Verification incomplete. Please try logging in.', 'info');
                navigate('/login');
            }
        } catch (err: any) {
            console.error('Verification error:', err);
            setError(err.message || 'Invalid verification code.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        setError('');
        try {
            await resendSignUpCode({ username: email });
            addToast('A new code has been sent to your email.', 'success');
        } catch (err: any) {
            console.error('Resend error:', err);
            setError(err.message || 'Failed to resend code.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className={styles.authLayout}>
            <div className={styles.authBackground}>
                <div className={styles.blob1} />
                <div className={styles.blob2} />
            </div>

            <main className={styles.authCard}>
                <header className={styles.header}>
                    <div className={styles.brandLogo}>
                        <span className={`material-symbols-outlined ${styles.brandIcon}`}>mark_email_read</span>
                    </div>
                    <h1 className={styles.title}>Check your email</h1>
                    <p className={styles.subtitle}>
                        We've sent a 6-digit confirmation code to: <br />
                        <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
                    </p>
                </header>

                <form onSubmit={handleVerify} className={styles.formGroup}>
                    {error && <div className={styles.errorText}>{error}</div>}

                    <div className={styles.inputField}>
                        <label className={styles.inputLabel} htmlFor="code">Verification Code</label>
                        <div className={styles.inputWrap}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>pin</span>
                            <input
                                id="code"
                                type="text"
                                className={styles.textInput}
                                placeholder="123456"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={isLoading || !code}
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <footer className={styles.footer}>
                    Didn't receive a code?{' '}
                    <button
                        type="button"
                        className={styles.linkText}
                        onClick={handleResendCode}
                        disabled={isResending}
                        style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: isResending ? 'not-allowed' : 'pointer' }}
                    >
                        {isResending ? 'Sending...' : 'Resend'}
                    </button>
                    <br /><br />
                    <Link to="/login" className={styles.linkText}>Back to Sign In</Link>
                </footer>
            </main>
        </div>
    );
}
