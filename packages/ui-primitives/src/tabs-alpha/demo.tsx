/**
 * Tabs Alpha Demo - Shows how to use the tabs-alpha components
 * This demonstrates the simplified tabs implementation for the Commerce SDK
 */

import React from 'react';
import { TabsRoot, TabsList, TabsTab, TabsPanel, Tabs } from './index';

/**
 * Example 1: Basic Tabs using individual components
 */
export function BasicTabsExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h3>Basic Tabs Example</h3>
      
      <TabsRoot defaultValue="tab1">
        <TabsList style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '1rem'
        }}>
          <TabsTab 
            value="tab1" 
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: '2px solid transparent'
            }}
          >
            Overview
          </TabsTab>
          <TabsTab 
            value="tab2"
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: '2px solid transparent'
            }}
          >
            Features
          </TabsTab>
          <TabsTab 
            value="tab3"
            style={{
              padding: '0.75rem 1rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderBottom: '2px solid transparent'
            }}
          >
            Pricing
          </TabsTab>
        </TabsList>

        <TabsPanel value="tab1" style={{ padding: '1rem' }}>
          <h4>Overview</h4>
          <p>This is the overview content. Here you can learn about the basic features and benefits.</p>
        </TabsPanel>

        <TabsPanel value="tab2" style={{ padding: '1rem' }}>
          <h4>Features</h4>
          <ul>
            <li>SSR-safe implementation</li>
            <li>Keyboard navigation support</li>
            <li>Accessibility compliant</li>
            <li>Framework agnostic</li>
          </ul>
        </TabsPanel>

        <TabsPanel value="tab3" style={{ padding: '1rem' }}>
          <h4>Pricing</h4>
          <p>Free and open source! No hidden costs or premium features.</p>
        </TabsPanel>
      </TabsRoot>
    </div>
  );
}

/**
 * Example 2: Compound Tabs Component
 */
export function CompoundTabsExample() {
  const tabsData = [
    {
      value: 'products',
      label: '🛍️ Products',
      content: (
        <div>
          <h4>Our Products</h4>
          <p>Browse our collection of digital products and services.</p>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              <strong>Premium Course</strong>
              <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>Complete blockchain development</p>
            </div>
            <div style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
              <strong>Digital Art NFT</strong>
              <p style={{ margin: '0.5rem 0 0', color: '#6b7280' }}>Unique generative art</p>
            </div>
          </div>
        </div>
      )
    },
    {
      value: 'services',
      label: '⚡ Services',
      content: (
        <div>
          <h4>Our Services</h4>
          <p>Professional services to help you succeed.</p>
          <ul style={{ marginTop: '1rem' }}>
            <li>Custom development</li>
            <li>Technical consulting</li>
            <li>Code audits</li>
            <li>Training workshops</li>
          </ul>
        </div>
      )
    },
    {
      value: 'support',
      label: '🎧 Support',
      content: (
        <div>
          <h4>Support Center</h4>
          <p>Get help when you need it most.</p>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Email:</strong> support@example.com</p>
            <p><strong>Hours:</strong> 9 AM - 5 PM EST</p>
            <p><strong>Response time:</strong> Within 24 hours</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '2rem', maxWidth: '600px' }}>
      <h3>Compound Tabs Example</h3>
      
      <Tabs
        tabs={tabsData}
        defaultValue="products"
        listProps={{
          style: { 
            display: 'flex', 
            gap: '0.25rem',
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '1.5rem'
          }
        }}
        tabProps={{
          style: {
            padding: '0.75rem 1.25rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontWeight: '500'
          }
        }}
        panelProps={{
          style: {
            padding: '1.5rem',
            minHeight: '200px'
          }
        }}
        onValueChange={(value) => {
          console.log('Tab changed to:', value);
        }}
      />
    </div>
  );
}

/**
 * Example 3: Vertical Tabs
 */
export function VerticalTabsExample() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h3>Vertical Tabs Example</h3>
      
      <TabsRoot defaultValue="dashboard" orientation="vertical">
        <div style={{ display: 'flex', gap: '2rem' }}>
          <TabsList style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            minWidth: '200px'
          }}>
            <TabsTab 
              value="dashboard"
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                textAlign: 'left'
              }}
            >
              📊 Dashboard
            </TabsTab>
            <TabsTab 
              value="analytics"
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                textAlign: 'left'
              }}
            >
              📈 Analytics
            </TabsTab>
            <TabsTab 
              value="settings"
              style={{
                padding: '0.75rem 1rem',
                border: '1px solid #e5e7eb',
                background: 'white',
                cursor: 'pointer',
                borderRadius: '0.5rem',
                textAlign: 'left'
              }}
            >
              ⚙️ Settings
            </TabsTab>
          </TabsList>

          <div style={{ flex: 1 }}>
            <TabsPanel value="dashboard" style={{ 
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              minHeight: '300px'
            }}>
              <h4>Dashboard</h4>
              <p>Welcome to your dashboard! Here's an overview of your account.</p>
              <div style={{ marginTop: '1rem', display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <strong>Total Sales</strong>
                  <p style={{ fontSize: '1.5rem', margin: '0.5rem 0 0' }}>$12,345</p>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                  <strong>Active Users</strong>
                  <p style={{ fontSize: '1.5rem', margin: '0.5rem 0 0' }}>1,234</p>
                </div>
              </div>
            </TabsPanel>

            <TabsPanel value="analytics" style={{ 
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              minHeight: '300px'
            }}>
              <h4>Analytics</h4>
              <p>Detailed analytics and insights about your performance.</p>
              <div style={{ marginTop: '1rem' }}>
                <p><strong>Page Views:</strong> 45,678</p>
                <p><strong>Conversion Rate:</strong> 3.2%</p>
                <p><strong>Bounce Rate:</strong> 24.5%</p>
              </div>
            </TabsPanel>

            <TabsPanel value="settings" style={{ 
              padding: '1.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              minHeight: '300px'
            }}>
              <h4>Settings</h4>
              <p>Configure your account and preferences.</p>
              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  Enable notifications
                </label>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  Dark mode
                </label>
                <label style={{ display: 'block', marginBottom: '1rem' }}>
                  <input type="checkbox" style={{ marginRight: '0.5rem' }} />
                  Auto-save
                </label>
              </div>
            </TabsPanel>
          </div>
        </div>
      </TabsRoot>
    </div>
  );
}

/**
 * Demo Page showing all examples
 */
export function TabsAlphaDemo() {
  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      <h1>Tabs Alpha Demo</h1>
      <p style={{ color: '#6b7280', marginBottom: '3rem' }}>
        Demonstration of the simplified tabs implementation for the Commerce SDK UI Primitives.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <BasicTabsExample />
        <CompoundTabsExample />
        <VerticalTabsExample />
      </div>

      <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
        <h4>Features Demonstrated:</h4>
        <ul style={{ marginTop: '1rem' }}>
          <li>✅ Keyboard navigation (arrow keys)</li>
          <li>✅ Accessibility (ARIA attributes)</li>
          <li>✅ Controlled and uncontrolled modes</li>
          <li>✅ Horizontal and vertical orientations</li>
          <li>✅ Individual and compound component usage</li>
          <li>✅ SSR-safe implementation</li>
        </ul>
      </div>
    </div>
  );
} 