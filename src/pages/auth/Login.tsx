import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signIn } from '../../services/authAdapter';
import { useAppStore } from '../../store/useAppStore';
import styles from './Auth.module.css';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuthStatus, addToast } = useAppStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn({ username: email, password });

            if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
                addToast('Please verify your email address.', 'info');
                navigate('/verify-email', { state: { email } });
            } else if (result.isSignedIn) {
                setAuthStatus(true);
                addToast('Welcome back!', 'success');
                navigate(from, { replace: true });
            } else {
                // Handle MFA or other steps if needed in future
                throw new Error(`Unhandled sign in step: ${result.nextStep.signInStep}`);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setIsLoading(false);
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
                        <span className={`material-symbols-outlined ${styles.brandIcon}`}>restaurant_menu</span>
                        PlateMate
                    </div>
                    <h1 className={styles.title}>Sign In</h1>
                    <p className={styles.subtitle}>Welcome back! Please enter your details.</p>
                </header>

                <form onSubmit={handleLogin} className={styles.formGroup}>
                    {error && <div className={styles.errorText}>{error}</div>}

                    <div className={styles.inputField}>
                        <label className={styles.inputLabel} htmlFor="email">Email</label>
                        <div className={styles.inputWrap}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>mail</span>
                            <input
                                id="email"
                                type="email"
                                className={styles.textInput}
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputField}>
                        <label className={styles.inputLabel} htmlFor="password">Password</label>
                        <div className={styles.inputWrap}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>lock</span>
                            <input
                                id="password"
                                type="password"
                                className={styles.textInput}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.passwordActions}>
                        <Link to="/forgot-password" className={styles.linkText}>Forgot password?</Link>
                    </div>

                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={isLoading || !email || !password}
                    >
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <footer className={styles.footer}>
                    Don't have an account? <Link to="/signup" className={styles.linkText}>Sign up</Link>
                </footer>
            </main>
        </div>
    );
}
