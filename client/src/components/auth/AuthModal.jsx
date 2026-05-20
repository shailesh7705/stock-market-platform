import { X } from "lucide-react";
import Login from "../../pages/Login";
import Signup from "../../pages/Signup";

function AuthModal({

  open,
  onClose,
  type,
  setType

}) {

  if (!open) return null;

  return (

    <div
      className="

        fixed inset-0 z-100

        bg-black/60

        backdrop-blur-sm

        flex items-center justify-center

        px-4

      "
    >

      <div
        className="

          relative

          w-full max-w-md

          bg-[#0f172a]

          border border-white/10

          rounded-3xl

          p-6

          shadow-2xl

        "
      >

        {/* Close */}
        <button

          onClick={onClose}

          className="

            absolute top-5 right-5

            text-gray-400

            hover:text-white

          "

        >

          <X size={22} />

        </button>

        {/* Tabs */}
        <div className="flex gap-3 mb-6">

          <button

            onClick={() => setType("login")}

            className={`

              flex-1 py-3 rounded-xl font-medium transition-all

              ${type === "login"

                ? "bg-green-500 text-white"

                : "bg-white/5 text-gray-400"}

            `}

          >

            Login

          </button>

          <button

            onClick={() => setType("signup")}

            className={`

              flex-1 py-3 rounded-xl font-medium transition-all

              ${type === "signup"

                ? "bg-green-500 text-white"

                : "bg-white/5 text-gray-400"}

            `}

          >

            Signup

          </button>

        </div>

        {/* Forms */}
        <div>

          {type === "login"

            ? <Login />

            : <Signup />

          }

        </div>

      </div>

    </div>

  );

}

export default AuthModal;