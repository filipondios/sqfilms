document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".delete-form").forEach(form => {
        const button = form.querySelector(".delete-btn");

        button.addEventListener("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const titleEl = form.closest("li")?.querySelector(".review-title");
            const title = titleEl ? titleEl.textContent.trim() : "this review";
            const confirmed = window.confirm(`Are you sure you want to delete "${title}"?`);

            if (!confirmed) 
                return;

            try {
                const action = form.getAttribute("action");
                const resp = await fetch(action, { method: "POST" });

                if (!resp.ok) 
                    throw new Error("Request failed");
                const data = await resp.json();
    
                form.closest("li").remove();
                alert(data.success || "Review deleted successfully");
        
            } catch (err) {
                console.error("Error deleting review:", err);
                alert("Could not delete the review. Please try again.");
            }
        });
    });
});
