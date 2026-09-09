'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleSurveyOptInProps {
  orderNumber: string;
  email: string;
  deliveryCountry?: string;
  estimatedDeliveryDate: string;
  gtins?: string[];
  merchantId?: number;
}

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: {
      load: (api: string, callback: () => void) => void;
      surveyoptin?: {
        render: (config: Record<string, unknown>) => void;
      };
    };
  }
}

export function GoogleSurveyOptIn({
  orderNumber,
  email,
  deliveryCountry = 'PK',
  estimatedDeliveryDate,
  gtins = [],
  merchantId = 5778703057,
}: GoogleSurveyOptInProps) {
  useEffect(() => {
    if (!orderNumber || !email) return;

    const renderSurvey = () => {
      if (typeof window !== 'undefined' && window.gapi?.surveyoptin) {
        const config: Record<string, unknown> = {
          merchant_id: merchantId,
          order_id: orderNumber,
          email: email,
          delivery_country: deliveryCountry,
          estimated_delivery_date: estimatedDeliveryDate,
          opt_in_style: 'CENTER_DIALOG',
        };

        if (gtins && gtins.length > 0) {
          config.products = gtins.map((gtin) => ({ gtin }));
        }

        window.gapi.surveyoptin.render(config);
      }
    };

    window.renderOptIn = function () {
      if (window.gapi) {
        window.gapi.load('surveyoptin', () => {
          renderSurvey();
        });
      }
    };

    // If gapi is already loaded in the browser session
    if (window.gapi?.surveyoptin) {
      renderSurvey();
    } else if (window.gapi?.load) {
      window.gapi.load('surveyoptin', () => {
        renderSurvey();
      });
    }
  }, [orderNumber, email, deliveryCountry, estimatedDeliveryDate, merchantId, gtins]);

  if (!orderNumber || !email) return null;

  return (
    <Script
      id="google-survey-optin-script"
      src="https://apis.google.com/js/platform.js?onload=renderOptIn"
      strategy="afterInteractive"
    />
  );
}
