export function DemoStory() {
  return (
    <section className="demo-story">
      <div>
        <p className="eyebrow">Owner value</p>
        <h2>Show this in the salon</h2>
        <p>
          Customer WhatsApp par message karta hai. AI booking leta hai. Reminder jata
          hai. Service complete hoti hai. Payment and invoice auto. Owner ko revenue,
          staff, customers, and next action simple language mein milta hai.
        </p>
      </div>
      <div className="phone-preview" aria-label="WhatsApp owner report preview">
        <div className="phone-top">WhatsApp Owner Report</div>
        <div className="wa-bubble">
          <strong>Today summary</strong>
          <p>Revenue: Rs 18,400</p>
          <p>Customers: 22</p>
          <p>WhatsApp bookings: 64%</p>
          <p>Best service: Hair Spa</p>
          <p>Suggestion: Thursday facial offer bhejein?</p>
        </div>
        <button type="button" className="wa-action">
          Send offer to inactive customers
        </button>
      </div>
    </section>
  );
}
