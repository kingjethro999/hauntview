/**
 * HauntView Component Examples
 * Demonstrates proper usage of design system components
 * Following the Halloween theme with WCAG AA accessibility
 */

import React from 'react';

/**
 * BUTTONS
 * Primary, Secondary, Danger, and Ghost variants with proper states
 */

export function ButtonPrimary() {
  return (
    <button
      className="
        bg-[#582696] 
        text-[#F5F5FA]
        border border-[#6C3CAA]
        px-6 py-3
        rounded-lg
        font-semibold
        text-sm
        shadow-[0_4px_12px_rgba(88,38,150,0.25)]
        hover:bg-[#6C3CAA]
        hover:shadow-[0_6px_20px_rgba(88,38,150,0.35)]
        hover:-translate-y-0.5
        active:bg-[#441C78]
        active:translate-y-0
        active:shadow-[0_2px_8px_rgba(88,38,150,0.25)]
        disabled:bg-[#4B5563]
        disabled:text-[#646478]
        disabled:cursor-not-allowed
        transition-all
        duration-200
        focus-visible:outline-2
        focus-visible:outline-[#DC6428]
        focus-visible:outline-offset-2
      "
    >
      Run Tests
    </button>
  );
}

export function ButtonSecondary() {
  return (
    <button
      className="
        bg-[#DC6428]
        text-[#F5F5FA]
        border border-[#B43C14]
        px-6 py-3
        rounded-lg
        font-semibold
        text-sm
        shadow-[0_4px_12px_rgba(220,100,40,0.25)]
        hover:bg-[#B43C14]
        hover:shadow-[0_6px_20px_rgba(220,100,40,0.35)]
        hover:-translate-y-0.5
        active:bg-[#8B2E0F]
        transition-all
        duration-200
      "
    >
      Download Report
    </button>
  );
}

export function ButtonGhost() {
  return (
    <button
      className="
        bg-transparent
        text-[#582696]
        border border-[#6C3CAA]
        px-5 py-2.5
        rounded-lg
        font-semibold
        text-sm
        hover:bg-[rgba(88,38,150,0.1)]
        hover:border-[#DC6428]
        hover:text-[#DC6428]
        transition-all
        duration-200
      "
    >
      Cancel
    </button>
  );
}

/**
 * CARDS
 * Elevated surface for content with hover effects
 */

export function Card({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="
        bg-[#373746]
        border border-[rgba(108,60,170,0.3)]
        rounded-[12px]
        p-6
        shadow-[0_8px_24px_rgba(0,0,0,0.4)]
        hover:border-[rgba(220,100,40,0.5)]
        hover:shadow-[0_12px_32px_rgba(88,38,150,0.2)]
        transition-all
        duration-200
      "
    >
      <h3 className="text-h2 text-[#F5F5FA] font-bold font-display mb-3">{title}</h3>
      <p className="text-body text-[#646478] leading-relaxed">{description}</p>
    </div>
  );
}

/**
 * FORM INPUTS
 * Text input with focus and error states
 */

export function FormInput({ label, error }: { label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-label text-[#F5F5FA] font-semibold">
        {label}
        <span className="text-[#dc2626] ml-1">*</span>
      </label>
      <input
        type="text"
        placeholder="Enter value"
        className={`
          bg-[rgba(55,55,70,0.5)]
          border-2
          ${error ? 'border-[#dc2626]' : 'border-[#6C3CAA]'}
          text-[#F5F5FA]
          placeholder-[#646478]
          px-4 py-3
          rounded-lg
          text-sm
          focus:outline-none
          focus:border-[#DC6428]
          focus:shadow-[0_0_0_3px_rgba(220,100,40,0.1)]
          focus:bg-[rgba(55,55,70,0.7)]
          disabled:bg-[rgba(55,55,70,0.3)]
          disabled:text-[#646478]
          disabled:cursor-not-allowed
          transition-all
          duration-200
        `}
      />
      {error && <p className="text-body-sm text-[#dc2626] font-medium">{error}</p>}
    </div>
  );
}

/**
 * ALERT
 * Color-coded alerts with icons (Heroicons)
 */

export function AlertSuccess({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="
        bg-[rgba(22,163,74,0.1)]
        border-l-4
        border-[#16a34a]
        text-[#86efac]
        p-4
        rounded-lg
        flex
        gap-3
        items-start
      "
    >
      <div className="text-[#16a34a] text-xl leading-none mt-0.5">✓</div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    </div>
  );
}

export function AlertError({ title, message }: { title: string; message: string }) {
  return (
    <div
      className="
        bg-[rgba(220,38,38,0.1)]
        border-l-4
        border-[#dc2626]
        text-[#fca5a5]
        p-4
        rounded-lg
        flex
        gap-3
        items-start
      "
    >
      <div className="text-[#dc2626] text-xl leading-none mt-0.5">!</div>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs opacity-90">{message}</p>
      </div>
    </div>
  );
}

/**
 * BADGE
 * Small labeled tags with color variants
 */

export function Badge({
  label,
  variant = 'primary',
}: {
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
}) {
  const variantStyles = {
    primary: 'bg-[rgba(88,38,150,0.2)] text-[#582696] border-[rgba(88,38,150,0.5)]',
    success: 'bg-[rgba(22,163,74,0.2)] text-[#16a34a] border-[rgba(22,163,74,0.5)]',
    warning: 'bg-[rgba(234,88,12,0.2)] text-[#ea580c] border-[rgba(234,88,12,0.5)]',
    error: 'bg-[rgba(220,38,38,0.2)] text-[#dc2626] border-[rgba(220,38,38,0.5)]',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-3
        py-1
        rounded-full
        text-xs
        font-semibold
        border
        ${variantStyles[variant]}
      `}
    >
      {label}
    </span>
  );
}

/**
 * PROGRESS BAR
 * Visual progress indicator with gradient
 */

export function ProgressBar({ percentage = 75 }: { percentage?: number }) {
  return (
    <div className="w-full">
      <div
        className="
          bg-[rgba(108,60,170,0.2)]
          rounded-lg
          h-2
          overflow-hidden
        "
      >
        <div
          className="
            h-full
            bg-gradient-to-r
            from-[#582696]
            to-[#DC6428]
            shadow-[0_0_8px_rgba(88,38,150,0.5)]
            transition-all
            duration-300
          "
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-body-sm text-[#646478] mt-2">{percentage}% Complete</p>
    </div>
  );
}

/**
 * MODAL
 * Dialog container with overlay
 */

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="
          fixed
          inset-0
          bg-[rgba(0,0,0,0.7)]
          backdrop-blur-sm
          z-[999]
        "
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          fixed
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          bg-[#0F0F14]
          border border-[#6C3CAA]
          rounded-[12px]
          w-[90%]
          max-w-[600px]
          max-h-[90vh]
          overflow-auto
          shadow-[0_20px_60px_rgba(0,0,0,0.6)]
          z-[1000]
        "
      >
        {/* Header */}
        <div
          className="
            border-b
            border-[rgba(108,60,170,0.3)]
            p-6
            flex
            justify-between
            items-center
          "
        >
          <h2 className="text-h1 text-[#F5F5FA] font-bold font-display">{title}</h2>
          <button
            onClick={onClose}
            className="
              text-[#646478]
              hover:text-[#DC6428]
              transition-colors
              duration-200
              text-2xl
              leading-none
            "
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </>
  );
}

/**
 * TABLE
 * Data display with alternating rows
 */

export function DataTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr
            className="
              bg-[rgba(88,38,150,0.15)]
              border-b-2
              border-[#6C3CAA]
            "
          >
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#F5F5FA]">Test Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-[#F5F5FA]">Status</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-[#F5F5FA]">Duration</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3].map((i) => (
            <tr
              key={i}
              className={`
                border-b border-[rgba(108,60,170,0.2)]
                hover:bg-[rgba(88,38,150,0.08)]
                transition-colors
                ${i % 2 === 0 ? 'bg-[rgba(55,55,70,0.3)]' : ''}
              `}
            >
              <td className="px-6 py-4 text-sm text-[#F5F5FA]">Accessibility Test</td>
              <td className="px-6 py-4 text-sm">
                <Badge label="Passed" variant="success" />
              </td>
              <td className="px-6 py-4 text-sm text-right text-[#646478]">2.5s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * NAVIGATION HEADER
 * Sticky header with navigation items
 */

export function NavigationHeader() {
  return (
    <nav
      className="
        sticky
        top-0
        h-16
        bg-[rgba(15,15,20,0.95)]
        border-b border-[rgba(108,60,170,0.3)]
        backdrop-blur-[10px]
        flex
        items-center
        px-6
        gap-8
        z-[100]
      "
    >
      <div className="text-h2 font-bold text-[#582696] font-display">HauntView</div>
      <div className="flex gap-4 ml-auto">
        {['Dashboard', 'Tests', 'Reports'].map((item) => (
          <button
            key={item}
            className="
              text-[#646478]
              text-sm
              font-medium
              px-4
              py-2
              rounded-lg
              hover:text-[#DC6428]
              hover:bg-[rgba(220,100,40,0.1)]
              transition-all
              duration-200
            "
          >
            {item}
          </button>
        ))}
      </div>
    </nav>
  );
}

/**
 * EMPTY STATE
 * Message when no data is available
 */

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-16 px-6">
      <div
        className="
          text-8xl
          text-[#646478]
          opacity-50
          mb-6
          leading-none
        "
      >
        👻
      </div>
      <h3 className="text-h2 text-[#F5F5FA] font-bold mb-2">{title}</h3>
      <p className="text-body text-[#646478] max-w-sm mx-auto mb-8">{description}</p>
      <button
        className="
          bg-[#582696]
          text-[#F5F5FA]
          px-6
          py-3
          rounded-lg
          font-semibold
          text-sm
          hover:bg-[#6C3CAA]
          transition-colors
        "
      >
        Get Started
      </button>
    </div>
  );
}

/**
 * LOADING SPINNER
 * Animated circular indicator
 */

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div
        className="
          w-12
          h-12
          border-4
          border-[rgba(88,38,150,0.2)]
          border-t-[#582696]
          rounded-full
          animate-spin
        "
        style={{ animationDuration: '2s' }}
      />
      <span className="ml-4 text-[#646478]">Loading...</span>
    </div>
  );
}

/**
 * GRADIENT BACKGROUND
 * Atmospheric haunted effect for sections
 */

export function GradientSection({ children }: { children: React.ReactNode }) {
  return (
    <section
      className="
        w-full
        py-16
        px-6
        bg-gradient-to-b
        from-[rgba(68,28,120,0.2)]
        to-[#0F0F14]
      "
    >
      {children}
    </section>
  );
}
