import { AuthForm } from '../../../libs/shared-ui/AuthForm';
import { signUp } from '../../../lib/auth/actions';

export const metadata = { title: 'Sign Up — The JESUS App' };

export default function SignUpPage() {
  return <AuthForm mode="sign-up" action={signUp} />;
}
