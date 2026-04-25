import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react';
import { Search, MessageSquare, ExternalLink, Users, Mail, Phone, Download } from 'lucide-react';
import { useProjectStore } from '../stores/StoreProvider';

const CTALibrary = observer(({ onCtaSelected }) => {
  const projectStore = useProjectStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock CTA templates - in real implementation this would come from API
  const [ctaTemplates] = useState([
    {
      id: '1',
      title: 'Email Signup',
      description: 'Capture email addresses for newsletters',
      category: 'lead',
      icon: Mail,
      template: {
        text: 'Subscribe to our newsletter for exclusive updates!',
        buttonText: 'Subscribe Now',
        action: 'email-signup'
      },
      preview: 'https://via.placeholder.com/200x150/3b82f6/ffffff?text=Email+Signup'
    },
    {
      id: '2',
      title: 'Download Free Guide',
      description: 'Offer a valuable resource in exchange for contact info',
      category: 'lead',
      icon: Download,
      template: {
        text: 'Get our free comprehensive guide to mastering video marketing!',
        buttonText: 'Download Free Guide',
        action: 'download'
      },
      preview: 'https://via.placeholder.com/200x150/10b981/ffffff?text=Free+Guide'
    },
    {
      id: '3',
      title: 'Schedule Consultation',
      description: 'Book a call with your sales team',
      category: 'sales',
      icon: Phone,
      template: {
        text: 'Ready to take your business to the next level? Let\'s talk!',
        buttonText: 'Schedule Free Consultation',
        action: 'booking'
      },
      preview: 'https://via.placeholder.com/200x150/8b5cf6/ffffff?text=Consultation'
    },
    {
      id: '4',
      title: 'Join Community',
      description: 'Invite viewers to join your online community',
      category: 'engagement',
      icon: Users,
      template: {
        text: 'Join thousands of creators in our exclusive community!',
        buttonText: 'Join Community',
        action: 'community'
      },
      preview: 'https://via.placeholder.com/200x150/f59e0b/ffffff?text=Community'
    },
    {
      id: '5',
      title: 'Visit Website',
      description: 'Direct traffic to your main website',
      category: 'traffic',
      icon: ExternalLink,
      template: {
        text: 'Discover more amazing content on our website!',
        buttonText: 'Visit Website',
        action: 'website'
      },
      preview: 'https://via.placeholder.com/200x150/ef4444/ffffff?text=Website'
    },
    {
      id: '6',
      title: 'Follow on Social',
      description: 'Grow your social media following',
      category: 'social',
      icon: MessageSquare,
      template: {
        text: 'Follow us for daily inspiration and behind-the-scenes content!',
        buttonText: 'Follow on Instagram',
        action: 'social-follow'
      },
      preview: 'https://via.placeholder.com/200x150/ec4899/ffffff?text=Social'
    }
  ]);

  const categories = [
    { id: 'all', label: 'All CTAs', icon: MessageSquare },
    { id: 'lead', label: 'Lead Generation', icon: Mail },
    { id: 'sales', label: 'Sales', icon: Phone },
    { id: 'engagement', label: 'Engagement', icon: Users },
    { id: 'traffic', label: 'Traffic', icon: ExternalLink },
    { id: 'social', label: 'Social', icon: MessageSquare }
  ];

  const filteredCTAs = ctaTemplates.filter(cta => {
    const matchesSearch = cta.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cta.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || cta.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCtaSelect = (cta) => {
    onCtaSelected && onCtaSelected({
      ...cta.template,
      ctaId: cta.id,
      title: cta.title,
      selectedAt: new Date().toISOString()
    });
  };

  return (
    <div className="cta-library">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">CTA Library</h2>
        <p className="text-muted mb-6">Choose from pre-designed call-to-action templates</p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-4 h-4" />
          <input
            type="text"
            placeholder="Search CTAs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted hover:bg-secondary/80'
                }`}
              >
                <Icon className="w-3 h-3" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* CTA Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCTAs.map((cta) => {
            const Icon = cta.icon;
            return (
              <div
                key={cta.id}
                className="glass-card hover:shadow-glass-sm transition-all duration-200 group"
              >
                <div className="aspect-video mb-3 overflow-hidden rounded-lg">
                  <img
                    src={cta.preview}
                    alt={cta.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>

                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {cta.title}
                    </h3>
                    <p className="text-sm text-muted">
                      {cta.description}
                    </p>
                  </div>
                </div>

                <div className="bg-secondary/20 p-3 rounded-lg mb-4">
                  <p className="text-sm text-foreground italic mb-2">
                    "{cta.template.text}"
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-white text-xs rounded">
                    {cta.template.buttonText}
                  </div>
                </div>

                <button
                  onClick={() => handleCtaSelect(cta)}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Use This CTA
                </button>
              </div>
            );
          })}
        </div>

        {filteredCTAs.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted opacity-50 mx-auto mb-4" />
            <p className="text-muted">No CTAs found matching your search.</p>
          </div>
        )}

        {/* CTA Types Explanation */}
        <div className="mt-8 glass-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">CTA Types</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Lead Generation</h4>
                <p className="text-sm text-muted">Capture contact information for marketing</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Sales</h4>
                <p className="text-sm text-muted">Drive sales conversations and bookings</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Engagement</h4>
                <p className="text-sm text-muted">Build community and social connections</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ExternalLink className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Traffic</h4>
                <p className="text-sm text-muted">Drive visitors to your website or content</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CTALibrary;