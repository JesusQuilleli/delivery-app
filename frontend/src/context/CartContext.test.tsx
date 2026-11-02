import React from 'react';
import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, CartContext } from './CartContext';

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;

describe('CartContext', () => {
  it('incrementa la cantidad si el producto ya existe', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    expect(result.current.cart).toHaveLength(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.total).toBe(20);
  });

  it('agrega productos distintos por separado', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    act(() => result.current.addToCart({ id: 2, name: 'B', price: 20 }));
    expect(result.current.cart).toHaveLength(2);
  });

  it('elimina un producto', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    act(() => result.current.removeFromCart(1));
    expect(result.current.cart).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('vacía el carrito', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    act(() => result.current.addToCart({ id: 2, name: 'B', price: 20 }));
    act(() => result.current.clearCart());
    expect(result.current.cart).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('calcula el total correctamente', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    act(() => result.current.addToCart({ id: 2, name: 'B', price: 3.5 }));
    expect(result.current.total).toBe(13.5);
  });

  it('abre y cierra el drawer del carrito', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.setIsCartOpen(true));
    expect(result.current.isCartOpen).toBe(true);
    act(() => result.current.setIsCartOpen(false));
    expect(result.current.isCartOpen).toBe(false);
  });
});