import { createContext, useContext, useEffect, useReducer } from "react";
import { addToCartService } from "../services/cart-services/addToCartService";
import { getCartService } from "../services/cart-services/getCartService";
import { useAuth } from "./AuthContext";
import { getWishlistService } from "../services/wishlist-services/getWishlistService";
import { addToWishlistService } from "../services/wishlist-services/addToWishlistService";
import { removeFromWishlistService } from "../services/wishlist-services/removeFromWishlist";
import axios from "axios";
import { removeFromCartService } from "../services/cart-services/removeFromCartService";

const UserDataContext = createContext();

const initialUserData = {
  cartProducts: [],
  wishlistProducts: [],
};

const userDataReducer = (state, action) => {
  switch (action.type) {
    case "SET_CART": {
      return { ...state, cartProducts: [...action.payload] };
    }

    case "SET_WISHLIST": {
      return { ...state, wishlistProducts: [...action.payload] };
    }

    default:
      return state;
  }
};

export function UserProvider({ children }) {
  const [userDataState, dispatch] = useReducer(
    userDataReducer,
    initialUserData
  );

  const { auth } = useAuth();

  const addToCartHandler = async (product) => {
    const response = await addToCartService(product, auth.token);

    dispatch({ type: "SET_CART", payload: response.data.cart });
  };

  const addToWishlistHandler = async (product) => {
    const response = await addToWishlistService(product, auth.token);

    dispatch({ type: "SET_WISHLIST", payload: response.data.wishlist });
  };

  const getCartProducts = async () => {
    try {
      const response = await getCartService(auth.token);
      dispatch({ type: "SET_CART", payload: response.data.cart });
    } catch (error) {}
  };

  const removeFromCartHandler = async (product) => {
    const response = removeFromCartService(product._id, auth.token);
    dispatch({ type: "SET_CART", payload: (await response).data.cart });
  };

  const getWishlistProducts = async () => {
    try {
      const response = await getWishlistService(auth.token);
      dispatch({ type: "SET_WISHLIST", payload: response.data.wishlist });
    } catch (error) {}
  };

  const removeFromWishlistHandler = async (product) => {
    const response = await removeFromWishlistService(product._id, auth.token);
    dispatch({ type: "SET_WISHLIST", payload: response.data.wishlist });
  };

  const isProductInCart = (product) => {
    const found = userDataState.cartProducts.find(
      (item) => item._id === product._id
    );
    return found ? true : false;
  };

  const isProductInWishlist = (product) => {
    const found = userDataState.wishlistProducts.find(
      (item) => item._id === product._id
    );
    return found ? true : false;
  };

  const totalDiscountedPrice = userDataState.cartProducts?.reduce(
    (acc, curr) => acc + curr.discounted_price * curr.qty,
    0
  );

  const totalOriginalPrice = userDataState.cartProducts?.reduce(
    (acc, curr) => acc + curr.original_price * curr.qty,
    0
  );

  const discountPercent = () => {
    const totalPrice = userDataState?.cartProducts?.reduce(
      (acc, curr) => ({
        ...acc,
        original: acc.original + curr.original_price,
        discount: acc.discount + curr.discounted_price,
      }),
      { original: 0, discount: 0 }
    );

    const totalDiscount =
      (totalPrice.original - totalPrice.discount) / totalPrice.original;

    return totalDiscount?.toFixed(2) * 100;
  };

 
  useEffect(() => {
    getWishlistProducts();
    getCartProducts();
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        userDataState,
        dispatch,
        addToCartHandler,
        addToWishlistHandler,
        removeFromWishlistHandler,
        isProductInCart,
        removeFromCartHandler,
        isProductInWishlist,
        totalDiscountedPrice,
        totalOriginalPrice,
        discountPercent
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export const useUserData = () => useContext(UserDataContext);
