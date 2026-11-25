"use client";

import {useActionState, useState} from "react";
import {Eye, EyeOff} from "lucide-react";
import {signIn, type LoginState} from "./actions";

const initialState: LoginState = {
	message: "",
	email: "",
};

export default function LoginForm() {
	const [state, action, pending] = useActionState(signIn, initialState);
	const [passwordVisible, setPasswordVisible] = useState(false);

	return (
		<form action={action}>
			<div>
				<label htmlFor="email">Email</label>

				<input
					id="email"
					name="email"
					type="email"
					defaultValue={state.email}
					required
				/>
			</div>

			<div>
				<label htmlFor="password">Password</label>

				<div className="relative">
					<input id="password" name="password" type={passwordVisible ? "text" : "password"} required className="pr-12" />
					<button type="button" aria-label={passwordVisible ? "Hide password" : "Show password"} aria-pressed={passwordVisible} onClick={() => setPasswordVisible((visible) => !visible)} className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-[#675c52]" >
						{passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
					</button>
				</div>
			</div>

			{state.message && <p>{state.message}</p>}

			<button type="submit" disabled={pending}>
				{pending ? "Please wait..." : "Sign in"}
			</button>
		</form>
	);
}
