import React from 'react';
import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartProvider, CartContext } from './CartContext';

const makeWrapper = (path: string) => {
  return ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>
      <CartProvider>{children}</CartProvider>
    </MemoryRouter>
  );
};

const wrapper = makeWrapper('/demo-farmacia');

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

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

  it('persiste y restaura el carrito de la misma tienda', () => {
    const first = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => first.result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    first.unmount();

    const second = renderHook(() => React.useContext(CartContext), { wrapper });
    expect(second.result.current.cart).toHaveLength(1);
    expect(second.result.current.cart[0].name).toBe('A');
  });

  it('aísla el carrito entre tiendas', () => {
    const storeA = renderHook(() => React.useContext(CartContext), { wrapper: makeWrapper('/tienda-a') });
    act(() => storeA.result.current.addToCart({ id: 1, name: 'A', price: 10 }));
    storeA.unmount();

    const storeB = renderHook(() => React.useContext(CartContext), { wrapper: makeWrapper('/tienda-b') });
    expect(storeB.result.current.cart).toHaveLength(0);
    storeB.unmount();

    const backToA = renderHook(() => React.useContext(CartContext), { wrapper: makeWrapper('/tienda-a') });
    expect(backToA.result.current.cart).toHaveLength(1);
    expect(backToA.result.current.cart[0].name).toBe('A');
  });

  it('no permite superar el stock disponible', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10, stock: 2 }));
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10, stock: 2 }));
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10, stock: 2 }));
    expect(result.current.cart[0].quantity).toBe(2);
  });

  it('no agrega productos agotados', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.addToCart({ id: 1, name: 'A', price: 10, stock: 0 }));
    expect(result.current.cart).toHaveLength(0);
  });

  it('abre y cierra el drawer del carrito', () => {
    const { result } = renderHook(() => React.useContext(CartContext), { wrapper });
    act(() => result.current.setIsCartOpen(true));
    expect(result.current.isCartOpen).toBe(true);
    act(() => result.current.setIsCartOpen(false));
    expect(result.current.isCartOpen).toBe(false);
  });
});