export default function Login() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="space-y-4">
        <a
          href="http://localhost:5000/auth/google"
          className="block px-6 py-3 bg-black text-white rounded"
        >
          Continue with Google
        </a>

        <a
          href="http://localhost:5000/auth/github"
          className="block px-6 py-3 border rounded"
        >
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
