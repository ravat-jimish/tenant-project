
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

interface ProfileFormProps {
  initialProfile: {
    name: string;
    image: string | null;
    bio: string;
  };
}

export default function ProfileForm({
  initialProfile,
}: ProfileFormProps) {
  const router = useRouter();

  const [name, setName] = useState(initialProfile.name);
  const [image, setImage] = useState(initialProfile.image ?? "");
  const [bio, setBio] = useState(initialProfile.bio);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await authClient.updateUser({
        name: name.trim(),
        image: image.trim() || null,
        bio: bio.trim(),
      });

      if (error) {
        setError(error.message ?? "Unable to update profile.");
        return;
      }

      setSuccess("Profile updated successfully.");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update profile."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="mb-2 block text-sm font-medium">
            Full name
          </label>

          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Profile image URL
          </label>

          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://example.com/profile.jpg"
            className="w-full rounded-lg border px-3 py-2"
          />

          <p className="mt-1 text-xs text-gray-500">
            Enter an image URL. Leave blank to remove the image.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            About me
          </label>

          <textarea
            value={bio}
            maxLength={240}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border px-3 py-2"
            placeholder="Tell us something about yourself..."
          />

          <p className="mt-1 text-right text-xs text-gray-500">
            {bio.length}/240
          </p>
        </div>

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="text-sm text-green-700">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-2.5 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>

      </form>
    </div>
  );
}
