import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const {
        data: { amount: productStock },
      } = await api.get<Stock>(`/stock/${productId}`);

      const productCart: Product | undefined = cart.find(
        (product) => product.id === productId
      );

      if (productCart) {
        if (productCart.amount + 1 > productStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        productCart.amount++;

        setCart([...cart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        const { data: product } = await api.get<Product>(
          `/products/${productId}`
        );

        if (productStock < 1) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        const newCart = [...cart, { ...product, amount: 1 }];

        setCart(newCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productCart = cart.some((product) => product.id === productId);

      if (!productCart) {
        toast.error('Erro na remoção do produto');
        return;
      }

      const newCart = cart.filter((product) => product.id !== productId);

      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const {
        data: { amount: productStock },
      } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > productStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const productCart: Product | undefined = cart.find(
        (product) => product.id === productId
      );

      if (!productCart) {
        toast.error('Erro na alteração de quantidade do produto');
        return;
      }

      productCart.amount = amount;

      setCart([...cart]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
