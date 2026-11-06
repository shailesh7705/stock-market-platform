import { create } from "zustand";

const getStoredUser = () => {

  try {

    const storedUser =
      localStorage.getItem("user");

    if (

      !storedUser ||

      storedUser === "undefined"

    ) {

      return null;

    }

    return JSON.parse(storedUser);

  } catch (error) {

    return null;

  }

};

const useAuthStore = create((set) => ({

  user: getStoredUser(),

  token:

    localStorage.getItem("token")

    || null,

  setAuth: (user, token) => {

    localStorage.setItem(

      "user",

      JSON.stringify(user)

    );

    localStorage.setItem(

      "token",

      token

    );

    set({

      user,

      token

    });

  },

  patchUser: (partial) =>

    set((state) => {

      const user = { ...(state.user || {}), ...partial };

      localStorage.setItem("user", JSON.stringify(user));

      return { user };

    }),

  logout: () => {

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    set({

      user: null,

      token: null

    });

  }

}));

export default useAuthStore;