import { createStorefrontApiClient, StorefrontApiClient } from '@shopify/storefront-api-client';
import { CartItem, ProductResponse } from './types';
import {
  publicAccessToken,
  storeDomain,
  productId,
  cleanByTonVariantId,
  cleanByTonBaseKgValue,
  cleanByTonBaseLbsValue,
  cleanByTonBaseBottlesValue,
  personalAnnualFootprintVariantId,
  personalAnnualFootprintBaseKgValue,
  personalAnnualFootprintBaseLbsValue,
  personalAnnualFootprintBaseBottlesValue,
  specialChars,
} from './constants';
import { createCartAndAddItems, fetchProductWithVariants, getCartWebUrl } from './graphql';

document.addEventListener('DOMContentLoaded', async () => {
  let cleanByTonBasePrice = 0;
  let personalAnnualFootprintBasePrice = 0;

  const namePersonalFootprintWrapper = document.querySelector(
    `[dev-target=name-wrap-personal-footprint]`
  )!;
  const nameCleanByTonWrapper = document.querySelector(`[dev-target=name-wrap-clean-by-ton]`)!;
  const quantityInputCleanByTon = document.querySelector<HTMLInputElement>(
    '#Quantity-50339670589756'
  )!;
  const priceDisplayCleanByTon = document.querySelector('.purchase_price')!;
  const kgImpactDisplayCleanByTon = document.querySelector('.purchase_number-impact.is-kg')!;
  const bottlesImpactDisplayCleanByTon = document.querySelector(
    '.purchase_number-impact.is-bottles'
  )!;
  const quantityInputPersonalAnnualFootprint = document.querySelector<HTMLInputElement>(
    '#Quantity-50339670589758'
  )!;
  const priceDisplayPersonalAnnualFootprint = document.querySelector('.purchase_price-2')!;
  const kgImpactDisplayPersonalAnnualFootprint = document.querySelector(
    '.purchase_number-impact.is-kg-2'
  )!;
  const bottlesImpactDisplayPersonalAnnualFootprint = document.querySelector(
    '.purchase_number-impact.is-bottles-2'
  )!;

  const cartBody = document.querySelector('[dev-target=cart-body]')!;
  const cartCountElement = document.querySelector(`[dev-target=cart-count]`)!;
  const cartCheckboxWrap = document.querySelector<HTMLDivElement>(`[dev-target=checkbox-wrap]`)!;
  const cartCheckboxInput = cartCheckboxWrap?.querySelector(`input`)!;
  const cartBtnNumber = document.querySelector(`[dev-target=cart-btn-number]`)!;
  const cartEmptyStateElement = document.querySelector<HTMLDivElement>(
    '[dev-target=cart-empty-state]'
  )!;
  const cartItemPlaceholder = document.querySelector('[dev-target=cart-item]')!;
  const checkoutBtn = document.querySelector<HTMLDivElement>('[dev-target=checkout]')!;
  const subTotal = document.querySelector('[dev-target=sub-total]')!;
  let cartCheckbox = true;

  const buyButtons = document.querySelectorAll<HTMLDivElement>('.js-shopify-buy-now')!;

  const checkboxesConfig = [
    {
      checkbox: '#IsGift-50339670589756',
      field: '.form_main_field_wrap.is-gift',
      requiredInputs: ['#RecipientName-50339670589756', '#RecipientEmail-50339670589756'],
    },
    {
      checkbox: '#IsGift-50339670556988',
      field: '.form_main_field_wrap.is-gift-2',
      requiredInputs: ['#RecipientName-50339670556988', '#RecipientEmail-50339670556988'],
    },
  ];

  const storefrontClient = createStorefrontApiClient({
    storeDomain,
    apiVersion: '2024-04',
    publicAccessToken,
  });
  const fetchedProduct = await fetchProductWithVariants({
    storefrontClient,
    productId,
  });
  const lineItemsToAdd = createLineItemsManager();

  setPricesAndName({ fetchedProduct });
  checkboxesConfig.forEach(handleCheckboxLogic);
  cartInit();
  initializeQuantityLogic();
  checkoutBtnInit({
    checkoutButton: checkoutBtn,
    lineItemsToAdd,
    storefrontClient,
  });
  initAddToCartButtons(buyButtons);

  if (performance.navigation.type === performance.navigation.TYPE_BACK_FORWARD) {
    window.location.reload();
  }

  function setPricesAndName({ fetchedProduct }: { fetchedProduct: ProductResponse }) {
    fetchedProduct.product.variants.edges.forEach(variant => {
      const variantId = variant.node.id.split('/').pop();
      if (!variantId) return console.error('variantId not found');
      if (personalAnnualFootprintVariantId === variantId) {
        namePersonalFootprintWrapper.querySelector(`[dev-target=item-name]`)!.textContent =
          variant.node.title;
        personalAnnualFootprintBasePrice = Number(variant.node.price.amount);
      }
      if (cleanByTonVariantId === variantId) {
        nameCleanByTonWrapper.querySelector(`[dev-target=item-name]`)!.textContent =
          variant.node.title;
        cleanByTonBasePrice = Number(variant.node.price.amount);
      }
    });
  }

  function checkoutBtnInit({
    checkoutButton,
    lineItemsToAdd,
    storefrontClient,
  }: {
    checkoutButton: HTMLDivElement;
    lineItemsToAdd: ReturnType<typeof createLineItemsManager>;
    storefrontClient: StorefrontApiClient;
  }) {
    checkoutButton.addEventListener('click', async () => {
      try {
        checkoutButton.classList.add('disabled');

        const cart = await createCartAndAddItems({
          storefrontClient,
          attributes: [
            { key: 'GiftPromo', value: 'true' },
            {
              key: 'RegistryOptIn',
              value: lineItemsToAdd.checkOverTon() ? (cartCheckbox ? 'true' : 'false') : 'null',
            },
          ],
          lineItems: lineItemsToAdd.getPureItems(),
        });

        const { checkoutUrl } = await getCartWebUrl({
          storefrontClient,
          cartId: cart.id,
        });

        checkoutButton.classList.remove('disabled');
        window.location.href = checkoutUrl;
      } catch (error) {
        checkoutButton.classList.remove('disabled');
        console.error('error', error);
      }
    });
  }

  function cartInit() {
    cartCheckboxWrap.style.display = 'none';
    cartCheckboxInput.addEventListener('change', () => {
      cartCheckbox = cartCheckboxInput.checked;
    });
    cartBody.innerHTML = '';
    cartBody.appendChild(cartEmptyStateElement);
  }

  function initAddToCartButtons(buttons: NodeListOf<HTMLDivElement>) {
    buttons.forEach(button => {
      button.addEventListener('click', e => {
        const form = button.closest('form')!;
        const qtyInput = form.querySelector<HTMLInputElement>(`[dev-target=qty-input]`);
        const isGiftInput = form.querySelector<HTMLInputElement>(`[dev-target=is-gift]`);
        const isGiftNameInput = form.querySelector<HTMLInputElement>(`[dev-target=is-gift-name]`);
        const isGiftEmailInput = form.querySelector<HTMLInputElement>(`[dev-target=is-gift-email]`);
        const isGiftMessageInput = form.querySelector<HTMLInputElement>(
          `[dev-target=is-gift-message]`
        );
        const variantId = form.querySelector<HTMLInputElement>(`[dev-target=variant-id]`);

        // Get values
        const variantItemId = variantId?.value ?? '';
        const qty = qtyInput?.value ?? '0';
        const isGift = isGiftInput?.checked ?? false;
        const isGiftName = isGiftNameInput?.value ?? '';
        const isGiftEmail = isGiftEmailInput?.value ?? '';
        const isGiftMessage = isGiftMessageInput?.value ?? '';

        const isFormValid =
          form.checkValidity() && !specialChars.find(char => isGiftMessage.includes(char));

        if (!isGift || (isGift && isFormValid)) {
          e.preventDefault();
          addToCart({
            variantItemId,
            qty,
            isGift,
            product: fetchedProduct,
            isGiftEmail,
            isGiftMessage,
            isGiftName,
          });
        } else if (isGift && !isFormValid) {
          e.preventDefault();
          e.stopPropagation();
          form.reportValidity();
        }
      });
    });
  }

  function addToCart({
    variantItemId,
    qty,
    isGift,
    product,
    isGiftEmail,
    isGiftMessage,
    isGiftName,
  }: {
    variantItemId: string;
    qty: string;
    isGift: boolean;
    product: ProductResponse;
    isGiftName: string | null;
    isGiftEmail: string | null;
    isGiftMessage: string | null;
  }) {
    let merchandiseId = `gid://shopify/ProductVariant/${variantItemId}`;

    let quantity = parseInt(qty, 10);

    const currentVariant = product.product.variants.edges.find(
      ({ node: { id } }) => id === merchandiseId
    );
    if (!currentVariant) return console.error('currentVariant not found');

    if (!isGift) {
      const customProperties: Record<string, string> = {
        _isGift: 'false',
      };
      const attributes = Object.keys(customProperties).map(key => ({
        key,
        value: customProperties[key],
      }));
      lineItemsToAdd.push({
        merchandiseId,
        quantity,
        productName: currentVariant.node.title,
        productImage: currentVariant.node.image.url ?? '',
        productPrice: parseFloat(currentVariant.node.price.amount),
        attributes,
      });
    } else {
      const customProperties: Record<string, string> = {
        _isGift: 'true',
        'Gift Recipient Name': isGiftName ?? '',
        'Gift Recipient Email': isGiftEmail ?? '',
        'Gift Recipient Message': isGiftMessage ?? '',
      };
      const attributes = Object.keys(customProperties).map(key => ({
        key,
        value: customProperties[key],
      }));

      lineItemsToAdd.push({
        merchandiseId,
        quantity,
        productName: currentVariant.node.title,
        productImage: currentVariant.node.image.url ?? '',
        productPrice: parseFloat(currentVariant.node.price.amount),
        attributes,
      });
    }
    updateSubtotal();
  }

  function updateCart() {
    cartBody.innerHTML = '';
    const cartLength = lineItemsToAdd.get().length;
    cartCountElement.textContent = `(${cartLength})`;
    cartBtnNumber.textContent = `${cartLength}`;
    if (cartLength === 0) {
      cartBody.appendChild(cartEmptyStateElement);
      checkoutBtn.classList.add('disabled');
    } else {
      checkoutBtn.classList.remove('disabled');
    }
    lineItemsToAdd.get().forEach((item, index) => {
      const cartItem = cartItemPlaceholder.cloneNode(true) as HTMLDivElement;
      const image = cartItem.querySelector<HTMLImageElement>('[dev-target=cart-image]')!;
      const name = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-name]')!;
      const total = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-total]')!;
      const price = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-price]')!;
      const gift = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-gift]')!;
      const giftName = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-gift-name]')!;
      const giftMessage = cartItem.querySelector<HTMLDivElement>('[dev-target=cart-gift-message]')!;
      const cartDecrease = cartItem.querySelector('[dev-target=cart-decrease]');
      const cartInput = cartItem.querySelector<HTMLInputElement>('[dev-target=cart-input]')!;
      const cartIncrease = cartItem.querySelector('[dev-target=cart-increase]')!;
      const cartRemove = cartItem.querySelector('[dev-target=cart-remove]');

      if (item.productImage) {
        image.src = item.productImage;
        image.srcset = '';
      }
      name.textContent = item.productName;
      price.textContent = `$${item.productPrice}`;
      total.textContent = `$${(item.productPrice * item.quantity).toLocaleString()}`;
      cartInput.value = item.quantity.toString();
      if (item.attributes[0].value === 'true') {
        gift.innerHTML = '<strong>Gift: </strong> Yes';
        giftName.innerHTML = `<strong>To: </strong>${item.attributes[1].value}`;
        giftMessage.innerHTML = `<strong>Message: </strong>${item.attributes[3].value}`;
      } else {
        gift.classList.add('hide');
        giftName.classList.add('hide');
        giftMessage.classList.add('hide');
      }

      cartInput.addEventListener('input', e => {
        total.textContent = `$${(
          parseInt((e.target as HTMLInputElement).value) * item.productPrice
        ).toLocaleString()}`;
        lineItemsToAdd.setByIndex(index, {
          ...item,
          quantity: parseInt((e.target as HTMLInputElement).value),
        });
        updateSubtotal();
      });
      cartRemove?.addEventListener('click', () => {
        lineItemsToAdd.removeByIndex(index);
      });
      cartIncrease.addEventListener('click', () => {
        cartInput.value = (parseInt(cartInput.value, 10) + 1).toString();
        cartInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
      cartDecrease?.addEventListener('click', () => {
        if (parseInt(cartInput.value) === 1) {
          lineItemsToAdd.removeByIndex(index);
        } else {
          cartInput.value = (parseInt(cartInput.value, 10) - 1).toString();
          cartInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      cartBody.appendChild(cartItem);
    });
  }

  function updateSubtotal() {
    subTotal.textContent = `$${lineItemsToAdd.getTotalPrice().toLocaleString()}`;
  }
  function createLineItemsManager() {
    const items: CartItem[] = [];

    return {
      push(newItem: CartItem) {
        const existingItemIndex = items.findIndex(
          item =>
            item.merchandiseId === newItem.merchandiseId &&
            ((!item.attributes && !newItem.attributes) ||
              (item.attributes &&
                newItem.attributes &&
                item.attributes[2]?.value === newItem.attributes[2]?.value))
        );

        if (existingItemIndex !== -1) {
          items[existingItemIndex].quantity += newItem.quantity;
        } else {
          items.push(newItem);
        }
        updateCart();
        this.checkOverTon();

        return items.length;
      },
      setByIndex(index: number, values: CartItem) {
        items[index] = values;
        this.checkOverTon();
        return items;
      },
      removeByIndex(index: number) {
        if (index >= 0 && index < items.length) {
          items.splice(index, 1);
          updateCart();
          updateSubtotal();
          this.checkOverTon();
          return true;
        }
        return false;
      },
      get() {
        return items;
      },
      getTotalPrice() {
        return items.reduce((total, item) => {
          return total + item.quantity * item.productPrice;
        }, 0);
      },
      getPureItems() {
        return items.map(item => {
          const { merchandiseId, attributes, quantity } = item;
          return {
            merchandiseId,
            quantity,
            ...(attributes && { attributes }),
          };
        });
      },
      checkOverTon() {
        const cleanUpByTonMerchandiseId = `gid://shopify/ProductVariant/${cleanByTonVariantId}`;
        const personalAnnualFootprintMerchandiseId = `gid://shopify/ProductVariant/${personalAnnualFootprintVariantId}`;

        let quantitySum = 0;

        for (const item of items) {
          if (item.merchandiseId === cleanUpByTonMerchandiseId) {
            cartCheckboxWrap.style.display = 'flex';
            return true;
          }
          if (item.merchandiseId === personalAnnualFootprintMerchandiseId) {
            quantitySum += item.quantity;
            if (quantitySum > 4) {
              cartCheckboxWrap.style.display = 'flex';
              return true;
            }
          }
        }

        cartCheckboxWrap.style.display = 'none';
        return false;
      },
    };
  }

  function formatNumber(value: number) {
    return new Intl.NumberFormat('en-US').format(value);
  }

  function handleCheckboxLogic(config: {
    checkbox: string;
    field: string;
    requiredInputs: string[];
  }) {
    const checkbox = document.querySelector<HTMLInputElement>(config.checkbox);
    const field = document.querySelector(config.field);

    if (!checkbox || !field) {
      console.error(`Missing checkbox (${config.checkbox}) or field (${config.field})`);
      return;
    }

    const updateFieldState = () => {
      const isChecked = checkbox.checked;
      field.classList.toggle('visible', isChecked);

      config.requiredInputs.forEach(inputSelector => {
        const input = document.querySelector(inputSelector);
        if (input) {
          if (isChecked) {
            input.setAttribute('required', 'required');
          } else {
            input.removeAttribute('required');
          }
        } else {
          console.warn(`Required input (${inputSelector}) not found`);
        }
      });
    };

    // Attach event listener to the checkbox
    checkbox.addEventListener('change', updateFieldState);

    // Initialize field state on page load
    updateFieldState();
  }

  function updatePriceAndImpact(
    basePrice: number,
    quantity: number,
    priceDisplay: Element,
    kgImpactDisplay: Element,
    bottlesImpactDisplay: Element,
    baseKgValue: number,
    baseLbsValue: number,
    baseBottlesValue: number
  ) {
    const formattedKg = formatNumber(baseKgValue * quantity);
    const formattedLbs = formatNumber(baseLbsValue * quantity);
    const formattedBottles = formatNumber(baseBottlesValue * quantity);
    const totalPrice = (basePrice * quantity).toFixed(2);

    if (priceDisplay) {
      priceDisplay.textContent = `$${formatNumber(Number(totalPrice))}`;
    }

    if (kgImpactDisplay) {
      kgImpactDisplay.textContent = `${formattedKg} KG / ${formattedLbs} LBS`;
    }

    if (bottlesImpactDisplay) {
      bottlesImpactDisplay.textContent = `${formattedBottles}`;
    }
  }

  function handleQuantityChange(
    input: HTMLInputElement,
    priceDisplay: Element,
    kgImpactDisplay: Element,
    bottlesImpactDisplay: Element,
    basePrice: number,
    baseKgValue: number,
    baseLbsValue: number,
    baseBottlesValue: number
  ) {
    const quantity = parseInt(input.value, 10) || 1;
    updatePriceAndImpact(
      basePrice,
      quantity,
      priceDisplay,
      kgImpactDisplay,
      bottlesImpactDisplay,
      baseKgValue,
      baseLbsValue,
      baseBottlesValue
    );
  }
  function initializeQuantityLogic() {
    // Set default value and initialize calculation
    quantityInputCleanByTon.value = '1';
    quantityInputPersonalAnnualFootprint.value = '1';
    handleQuantityChange(
      quantityInputCleanByTon,
      priceDisplayCleanByTon,
      kgImpactDisplayCleanByTon,
      bottlesImpactDisplayCleanByTon,
      cleanByTonBasePrice,
      cleanByTonBaseKgValue,
      cleanByTonBaseLbsValue,
      cleanByTonBaseBottlesValue
    );
    handleQuantityChange(
      quantityInputPersonalAnnualFootprint,
      priceDisplayPersonalAnnualFootprint,
      kgImpactDisplayPersonalAnnualFootprint,
      bottlesImpactDisplayPersonalAnnualFootprint,
      personalAnnualFootprintBasePrice,
      personalAnnualFootprintBaseKgValue,
      personalAnnualFootprintBaseLbsValue,
      personalAnnualFootprintBaseBottlesValue
    );

    // Attach listeners for input changes
    quantityInputCleanByTon.addEventListener('input', () => {
      handleQuantityChange(
        quantityInputCleanByTon,
        priceDisplayCleanByTon,
        kgImpactDisplayCleanByTon,
        bottlesImpactDisplayCleanByTon,
        cleanByTonBasePrice,
        cleanByTonBaseKgValue,
        cleanByTonBaseLbsValue,
        cleanByTonBaseBottlesValue
      );
    });
    quantityInputCleanByTon.addEventListener('change', () => {
      handleQuantityChange(
        quantityInputCleanByTon,
        priceDisplayCleanByTon,
        kgImpactDisplayCleanByTon,
        bottlesImpactDisplayCleanByTon,
        cleanByTonBasePrice,
        cleanByTonBaseKgValue,
        cleanByTonBaseLbsValue,
        cleanByTonBaseBottlesValue
      );
    });
    quantityInputPersonalAnnualFootprint.addEventListener('input', () => {
      handleQuantityChange(
        quantityInputPersonalAnnualFootprint,
        priceDisplayPersonalAnnualFootprint,
        kgImpactDisplayPersonalAnnualFootprint,
        bottlesImpactDisplayPersonalAnnualFootprint,
        personalAnnualFootprintBasePrice,
        personalAnnualFootprintBaseKgValue,
        personalAnnualFootprintBaseLbsValue,
        personalAnnualFootprintBaseBottlesValue
      );
    });
    quantityInputPersonalAnnualFootprint.addEventListener('change', () => {
      handleQuantityChange(
        quantityInputPersonalAnnualFootprint,
        priceDisplayPersonalAnnualFootprint,
        kgImpactDisplayPersonalAnnualFootprint,
        bottlesImpactDisplayPersonalAnnualFootprint,
        personalAnnualFootprintBasePrice,
        personalAnnualFootprintBaseKgValue,
        personalAnnualFootprintBaseLbsValue,
        personalAnnualFootprintBaseBottlesValue
      );
    });

    // Attach listeners for Finsweet buttons
    const incrementButton = document.querySelector('[clean-up-input="increment"]');
    const decrementButton = document.querySelector('[clean-up-input="decrement"]');
    const incrementButton2 = document.querySelector('[personal-annual-input="increment"]');
    const decrementButton2 = document.querySelector('[personal-annual-input="decrement"]');

    if (incrementButton && decrementButton) {
      incrementButton.addEventListener('click', () =>
        setTimeout(() => {
          handleQuantityChange(
            quantityInputCleanByTon,
            priceDisplayCleanByTon,
            kgImpactDisplayCleanByTon,
            bottlesImpactDisplayCleanByTon,
            cleanByTonBasePrice,
            cleanByTonBaseKgValue,
            cleanByTonBaseLbsValue,
            cleanByTonBaseBottlesValue
          );
        }, 0)
      );
      decrementButton.addEventListener('click', () =>
        setTimeout(() => {
          handleQuantityChange(
            quantityInputCleanByTon,
            priceDisplayCleanByTon,
            kgImpactDisplayCleanByTon,
            bottlesImpactDisplayCleanByTon,
            cleanByTonBasePrice,
            cleanByTonBaseKgValue,
            cleanByTonBaseLbsValue,
            cleanByTonBaseBottlesValue
          );
        }, 0)
      );
    } else {
      console.warn('Finsweet input counter buttons not found');
    }
    if (incrementButton2 && decrementButton2) {
      incrementButton2.addEventListener('click', () =>
        setTimeout(() => {
          handleQuantityChange(
            quantityInputPersonalAnnualFootprint,
            priceDisplayPersonalAnnualFootprint,
            kgImpactDisplayPersonalAnnualFootprint,
            bottlesImpactDisplayPersonalAnnualFootprint,
            personalAnnualFootprintBasePrice,
            personalAnnualFootprintBaseKgValue,
            personalAnnualFootprintBaseLbsValue,
            personalAnnualFootprintBaseBottlesValue
          );
        }, 0)
      );
      decrementButton2.addEventListener('click', () =>
        setTimeout(() => {
          handleQuantityChange(
            quantityInputPersonalAnnualFootprint,
            priceDisplayPersonalAnnualFootprint,
            kgImpactDisplayPersonalAnnualFootprint,
            bottlesImpactDisplayPersonalAnnualFootprint,
            personalAnnualFootprintBasePrice,
            personalAnnualFootprintBaseKgValue,
            personalAnnualFootprintBaseLbsValue,
            personalAnnualFootprintBaseBottlesValue
          );
        }, 0)
      );
    } else {
      console.warn('Finsweet input counter buttons not found');
    }
  }

  // -------------------------------------------------------
  const attachCustomMessageFieldValidation = (
    form: HTMLFormElement | null,
    fieldsWrapperClassCombo: string
  ) => {
    if (!form) {
      console.warn('Form not found. Check your selector.');
      return;
    }

    const input = form.querySelector<HTMLTextAreaElement>('[data-name="RecipientMessage"]');

    if (!input) {
      console.warn(
        'Could not find input field with data-name="RecipientMessage". Check your selector.'
      );
      return;
    }

    const maxLength = 1024;

    input.setAttribute('maxlength', maxLength.toString());

    const errorText = document.createElement('div');
    errorText.style.color = '#ff3333';
    errorText.style.fontSize = '12px';
    errorText.style.marginTop = '4px';
    errorText.style.display = 'none';
    input.parentElement?.appendChild(errorText);

    function validateInput() {
      if (!input) return;

      const value = input.value;

      input.style.borderColor = '';
      errorText.style.display = 'none';

      const foundSpecialChar = specialChars.find(char => value.includes(char));

      if (foundSpecialChar) {
        input.style.borderColor = '#ff3333';
        errorText.textContent = 'Please avoid using special characters.';
        errorText.style.display = 'block';

        const giftField = document.querySelector(fieldsWrapperClassCombo);
        if (giftField) {
          (giftField as HTMLElement).style.maxHeight = '23rem';
        }

        return false;
      }

      const giftField = document.querySelector(fieldsWrapperClassCombo);
      if (giftField) {
        (giftField as HTMLElement).style.maxHeight = '20rem';
      }

      return true;
    }

    // Validate on input
    input.addEventListener('input', () => validateInput());
  };

  const personalAnnualFootprintForm = document.getElementById(
    'wf-form-Purchase-Form-Personal-3'
  ) as HTMLFormElement | null;
  const cleanByTonForm = document.getElementById(
    'purchase-form-50339670589756'
  ) as HTMLFormElement | null;

  attachCustomMessageFieldValidation(
    personalAnnualFootprintForm,
    '.form_main_field_wrap.is-gift-2.visible'
  );
  attachCustomMessageFieldValidation(cleanByTonForm, '.form_main_field_wrap.is-gift.visible');
});
