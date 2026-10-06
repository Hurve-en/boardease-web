"use client";

import {useActionState} from "react";
import {signIn, type LoginState} from "./actions";

const initialState: LoginState = {
	message: "",
	email: "",
};

export default function LoginForm() {
	const [state, action, pending] = useActionState(signIn, initialState);

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

				<input id="password" name="password" type="password" required />
			</div>

			{state.message && <p>{state.message}</p>}

			<button type="submit" disabled={pending}>
				{pending ? "Please wait..." : "Sign in"}
			</button>
		</form>
	);
}
