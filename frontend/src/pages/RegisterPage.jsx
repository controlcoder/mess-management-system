import { useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

import logo from "./../assets/iiit-logo.png";

const BRANCHES = ["CSE", "CE", "IT", "ETC", "EEE"];
const CURRENT_YEAR = new Date().getFullYear();
const BATCH_YEARS = Array.from(
  { length: 4 },
  (_, index) => CURRENT_YEAR - 3 + index,
);

function parseRollNumber(value) {
  const match = value
    .trim()
    .toLowerCase()
    .match(/^(\d{2})(cse|eee|etc|ce|it)(\d{3,4})$/i);
  if (!match) {
    return null;
  }

  return {
    batchYear: 2000 + Number(match[1]),
    branch: match[2].toUpperCase(),
  };
}

const inputClassName =
  "w-full rounded-2xl border border-brand-ink/10 bg-white px-4 py-3 text-base outline-none transition focus:border-brand-teal focus:ring-4 focus:ring-brand-teal/10";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gender, setGender] = useState("MALE");
  const [hostel, setHostel] = useState("BOYS");
  const [branch, setBranch] = useState("CSE");
  const [batchYear, setBatchYear] = useState(String(CURRENT_YEAR));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const parsedRoll = useMemo(() => parseRollNumber(rollNumber), [rollNumber]);

  if (user) {
    return (
      <Navigate to={user.role === "ADMIN" ? "/admin" : "/student"} replace />
    );
  }

  function handleRollNumberChange(value) {
    setRollNumber(value);
    const parsed = parseRollNumber(value);
    if (!parsed) {
      return;
    }

    setBranch(parsed.branch);
    setBatchYear(String(parsed.batchYear));
  }

  function handleGenderChange(value) {
    setGender(value);
    setHostel(value === "FEMALE" ? "GIRLS" : "BOYS");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const nextUser = await register({
        fullName: fullName.trim(),
        rollNumber: rollNumber.trim().toLowerCase(),
        password,
        gender,
        hostel,
        branch,
        batchYear: Number(batchYear),
      });
      window.location.assign(nextUser.role === "ADMIN" ? "/admin" : "/student");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="glass-panel rounded-[2rem] border border-white/80 p-8 shadow-panel sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-ink/50">
          Signup
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-brand-ink">
          Create your mess account
        </h1>
        <p className="mt-3 text-sm leading-6 text-brand-ink/60">
          Streamline your mess experience with smarter meal planning, easy
          management, and hassle-free dining.
        </p>

        <hr className="my-6 border-brand-ink/10" />

        <ul className="flex justify-center pt-14 text-brand-ink/70">
          <img src={logo} alt="iiit-logo" />
        </ul>
      </section>

      <section className="glass-panel rounded-[2rem] border border-white/80 p-8 shadow-panel sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-teal">
          Create account
        </p>
        <h2 className="mt-3 font-display text-3xl text-brand-ink">
          New student registration
        </h2>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">
              Full name
            </span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={inputClassName}
              placeholder="Your name"
              autoComplete="name"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">
              Roll number
            </span>
            <input
              value={rollNumber}
              onChange={(event) => handleRollNumberChange(event.target.value)}
              className={inputClassName}
              placeholder="b423051"
              autoComplete="username"
              required
            />
            {parsedRoll ? (
              <span className="mt-2 block text-xs text-brand-teal">
                Detected {parsedRoll.branch} batch {parsedRoll.batchYear}
              </span>
            ) : null}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">
                Gender
              </span>
              <select
                value={gender}
                onChange={(event) => handleGenderChange(event.target.value)}
                className={inputClassName}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">
                Hostel
              </span>
              <select
                value={hostel}
                onChange={(event) => setHostel(event.target.value)}
                className={inputClassName}
              >
                <option value="BOYS">Boys hostel</option>
                <option value="GIRLS">Girls hostel</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">
                Branch
              </span>
              <select
                value={branch}
                onChange={(event) => setBranch(event.target.value)}
                className={inputClassName}
              >
                {BRANCHES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-brand-ink">
                Batch year
              </span>
              <select
                value={batchYear}
                onChange={(event) => setBatchYear(event.target.value)}
                className={inputClassName}
              >
                {BATCH_YEARS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-brand-ink">
              Confirm password
            </span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClassName}
              placeholder="Re-enter password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-teal disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account..." : "Create account and continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-ink/70">
          Already registered?{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-teal hover:underline"
          >
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}
