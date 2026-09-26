/**
 * Funnel analytics (ANALYTICS_PLAN.md).
 *
 * `track` pushes to window.dataLayer and emits a `storefront:analytics`
 * DOM event, so any destination (GA4, Shopify customer events, a custom
 * endpoint) can subscribe later without touching components.
 */
import {useEffect, useRef} from 'react';
import {useLocation} from 'react-router';
import type {ProductSummary} from '~/lib/catalog/types';
import {readInterests} from '~/lib/personalization';

export type FunnelEvent =
  | 'page_view'
  | 'view_collection'
  | 'view_product'
  | 'select_problem'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'cart_open'
  | 'view_cross_sell'
  | 'add_cross_sell'
  | 'view_bundle_upgrade'
  | 'accept_bundle_upgrade'
  | 'progress_offer_view'
  | 'progress_offer_unlock'
  | 'begin_checkout'
  | 'checkout_blocked'
  | 'purchase'
  | 'view_promo'
  | 'use_promo'
  | 'quiz_start'
  | 'quiz_complete';

export type EventPayload = {
  product_handle?: string;
  product_factory_id?: string;
  product_format?: string;
  price_tier?: string;
  universe?: string[];
  business_type?: string[];
  campaign_id?: string;
  offer_id?: string;
  bundle_id?: string;
  value?: number;
  currency?: string;
  placement?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function productDimensions(product: ProductSummary): EventPayload {
  return {
    product_handle: product.handle,
    product_factory_id: product.factoryId,
    product_format: product.format,
    price_tier: product.tier,
    universe: product.problemTags,
    business_type: product.businessTags,
    value: product.priceCents / 100,
    currency: 'EUR',
  };
}

export function track(event: FunnelEvent, payload: EventPayload = {}) {
  if (typeof window === 'undefined') return;
  const entry = {event, ...payload, ts: Date.now()};
  (window.dataLayer ??= []).push(entry);
  window.dispatchEvent(new CustomEvent('storefront:analytics', {detail: entry}));
  // eslint-disable-next-line no-console
  if (import.meta.env.DEV) console.debug('[analytics]', event, payload);
}

/** Tracks client-side route changes with the current first-party interest profile. */
export function RouteAnalytics() {
  const location = useLocation();

  useEffect(() => {
    const interests = readInterests();
    track('page_view', {
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
      interest_tags: Object.keys(interests).filter((tag) => interests[tag] > 0),
    });
  }, [location.pathname, location.search]);

  return null;
}

/** Fires once per mount, when the element is at least half visible. */
export function useTrackOnView<T extends Element>(
  event: FunnelEvent,
  payload: EventPayload,
  enabled = true,
) {
  const ref = useRef<T>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const key = JSON.stringify(payload);

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    if (typeof IntersectionObserver === 'undefined') {
      track(event, payloadRef.current);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          track(event, payloadRef.current);
          observer.disconnect();
        }
      },
      {threshold: 0.5},
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [event, enabled, key]);

  return ref;
}
