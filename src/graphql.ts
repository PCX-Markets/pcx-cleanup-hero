import { StorefrontApiClient } from '@shopify/storefront-api-client';
import { CreateCartResponse, GetCartResponse, ProductResponse } from './types';

export async function createCartAndAddItems({
  storefrontClient,
  attributes = [],
  lineItems = [],
}: {
  storefrontClient: StorefrontApiClient;
  attributes: { key: string; value: string }[];
  lineItems: {
    merchandiseId: string;
    attributes?: { key: string; value: string }[];
    quantity: number;
  }[];
}) {
  try {
    const createCartMutation = `#graphql
      mutation cartCreate($input: CartInput!) {
        cartCreate(input: $input) {
          cart {
            id
            createdAt
            updatedAt
            attributes {
              key
              value
            }
            lines(first: 10) {
              edges {
                node {
                  id
                  merchandise {
                    ... on ProductVariant {
                      id
                      title
                    }
                  }
                  quantity
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const createCartResponse = await storefrontClient.request<CreateCartResponse>(
      createCartMutation,
      {
        variables: {
          input: {
            attributes,
            lines: lineItems,
          },
        },
      }
    );

    const cart = createCartResponse.data?.cartCreate.cart;
    if (!cart) {
      throw new Error('Error creating cart');
    }

    return cart;
  } catch (error) {
    console.error('Error in createCartAndAddItems:', error);
    throw error;
  }
}

export async function fetchProductWithVariants({
  storefrontClient,
  productId,
}: {
  storefrontClient: StorefrontApiClient;
  productId: number;
}) {
  try {
    const productQuery = `#graphql
      query ProductQuery($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                image {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    `;

    const response = await storefrontClient.request<ProductResponse>(productQuery, {
      variables: {
        id: `gid://shopify/Product/${productId}`,
      },
    });

    if (!response.data) {
      console.error('Product not found for id:', productId);
      throw response.errors;
    }
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

export async function getCartWebUrl({
  storefrontClient,
  cartId,
}: {
  storefrontClient: StorefrontApiClient;
  cartId: string;
}) {
  try {
    const cartQuery = `#graphql
      query cart($cartId: ID!) {
        cart(id: $cartId) {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                  }
                }
                quantity
              }
            }
          }
        }
      }
    `;

    const { data, errors } = await storefrontClient.request<GetCartResponse>(cartQuery, {
      variables: { cartId },
    });

    if (!data) {
      console.error('Errors fetching cart:', errors);
      throw errors;
    }

    return { checkoutUrl: data.cart.checkoutUrl };
  } catch (error) {
    console.error('Error fetching cart details:', error);
    throw error;
  }
}
