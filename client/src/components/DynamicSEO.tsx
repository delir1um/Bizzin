import { useEffect, useState } from 'react';
import { generateSEOData, generateDynamicKeywords, type SEOData } from '@/lib/services/seo';

interface DynamicSEOProps {
  children?: React.ReactNode;
}

/**
 * Component that dynamically updates SEO meta tags based on real platform data
 */
export default function DynamicSEO({ children }: DynamicSEOProps) {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [keywords, setKeywords] = useState<string>('');

  useEffect(() => {
    const loadSEOData = async () => {
      try {
        const [data, dynamicKeywords] = await Promise.all([
          generateSEOData(),
          generateDynamicKeywords()
        ]);
        
        setSeoData(data);
        setKeywords(dynamicKeywords);
        updateMetaTags(data, dynamicKeywords);
      } catch (error) {
        console.error('Error loading SEO data:', error);
      }
    };

    loadSEOData();
  }, []);

  const updateMetaTags = (data: SEOData, dynamicKeywords: string) => {
    // Update description with real stats
    const description = `Bizzin is South Africa's leading AI-powered business intelligence platform with ${data.stats.totalUsers}+ entrepreneurs using our goal tracking, business analytics, and intelligent journaling tools. Join ${data.stats.activeUsers}+ active users making data-driven business decisions.`;
    
    updateMetaTag('description', description);
    updateMetaTag('keywords', dynamicKeywords);
    
    // Update Open Graph tags
    updateMetaTag('og:title', `Bizzin - Trusted by ${data.stats.totalUsers}+ South African Entrepreneurs`);
    updateMetaTag('og:description', `Transform your business with AI-powered analytics. ${data.stats.completedGoals}+ goals completed, ${data.stats.averageRating}/5 rating from ${data.stats.totalReviews}+ reviews.`);
    
    // Update Twitter Card
    updateMetaTag('twitter:title', `Bizzin - ${data.stats.totalUsers}+ Entrepreneurs Trust Our Platform`);
    updateMetaTag('twitter:description', `AI business intelligence with ${data.stats.averageRating}/5 rating. Join successful entrepreneurs using Bizzin.`);
    
    // Update structured data
    updateStructuredData(data);
  };

  const updateMetaTag = (name: string, content: string) => {
    // Handle different meta tag types
    let selector = '';
    if (name.startsWith('og:')) {
      selector = `meta[property="${name}"]`;
    } else if (name.startsWith('twitter:')) {
      selector = `meta[name="${name}"]`;
    } else {
      selector = `meta[name="${name}"]`;
    }
    
    let metaTag = document.querySelector(selector) as HTMLMetaElement;
    
    if (metaTag) {
      metaTag.content = content;
    } else {
      // Create new meta tag if it doesn't exist
      metaTag = document.createElement('meta');
      if (name.startsWith('og:')) {
        metaTag.setAttribute('property', name);
      } else {
        metaTag.setAttribute('name', name);
      }
      metaTag.content = content;
      document.head.appendChild(metaTag);
    }
  };

  const updateStructuredData = (data: SEOData) => {
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Bizzin",
      "description": `AI-powered business intelligence platform for entrepreneurs featuring goal tracking, business analytics, intelligent journaling, and comprehensive business tools. Trusted by ${data.stats.totalUsers}+ users.`,
      "url": "https://bizzin.co.za",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "ZAR",
        "description": `Free tier available with premium features. ${data.stats.premiumUsers} premium subscribers.`
      },
      "creator": {
        "@type": "Organization",
        "name": "Bizzin",
        "url": "https://bizzin.co.za"
      },
      "featureList": data.features,
      "screenshot": "/favicon.png",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": data.stats.averageRating.toString(),
        "reviewCount": data.stats.totalReviews.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/UserPageVisits",
          "userInteractionCount": data.stats.activeUsers
        },
        {
          "@type": "InteractionCounter", 
          "interactionType": "https://schema.org/UserRegisters",
          "userInteractionCount": data.stats.totalUsers
        }
      ],
      "applicationSubCategory": data.businessCategories.join(", ")
    };

    if (existingScript) {
      existingScript.textContent = JSON.stringify(structuredData, null, 2);
    } else {
      const newScript = document.createElement('script');
      newScript.type = 'application/ld+json';
      newScript.textContent = JSON.stringify(structuredData, null, 2);
      document.head.appendChild(newScript);
    }
  };

  return <>{children}</>;
}