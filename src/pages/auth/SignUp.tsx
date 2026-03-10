import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signUp } from '../../services/authAdapter';
import { useAppStore } from '../../store/useAppStore';
import styles from './Auth.module.css';

export default function SignUp() {
    const navigate = useNavigate();
    const { addToast } = useAppStore();

    const [name, setName] = useState('');
    const [handle, setHandle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { isSignUpComplete, nextStep } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                        name: name,
                        preferred_username: handle,
                    }
                }
            });

            if (nextStep.signUpStep === 'CONFIRM_SIGN_UP' || !isSignUpComplete) {
                addToast('Account created! Please verify your email.', 'success');
                navigate('/verify-email', { state: { email } });
            } else {
                addToast('Account created successfully!', 'success');
                navigate('/login');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'An error occurred during sign up.');
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
                    <h1 className={styles.title}>Create your account</h1>
                    <p className={styles.subtitle}>Join PlateMate today to track your foodie journey.</p>
                </header>

                <form onSubmit={handleSignup} className={styles.formGroup}>
                    {error && <div className={styles.errorText}>{error}</div>}

                    <div className={styles.inputField}>
                        <label className={styles.inputLabel} htmlFor="name">Name</label>
                        <div className={styles.inputWrap}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>person</span>
                            <input
                                id="name"
                                type="text"
                                className={styles.textInput}
                                placeholder="John Doe"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.inputField}>
                        <label className={styles.inputLabel} htmlFor="handle">Handle</label>
                        <div className={styles.inputWrap}>
                            <span className={`material-symbols-outlined ${styles.inputIcon}`}>alternate_email</span>
                            <input
                                id="handle"
                                type="text"
                                className={styles.textInput}
                                placeholder="johndoe"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                required
                            />
                        </div>
                    </div>

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
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.btnSubmit}
                        disabled={isLoading || !email || !password || !name || !handle}
                    >
                        {isLoading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <footer className={styles.footer}>
                    Already have an account? <Link to="/login" className={styles.linkText}>Sign in</Link>
                </footer>
            </main>
        </div>
    );
}
