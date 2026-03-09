import Link from "next/link";
import { logoutAdmin } from "@/app/admin/actions";

export default function AdminNav() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-6">
            <span className="font-bold text-lg text-gray-800">NAPS Admin</span>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/races"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Races
            </Link>
          </div>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Logout
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
