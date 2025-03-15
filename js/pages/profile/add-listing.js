/**
 * Add Listing Page
 *
 * Initializes and manages the add listing page.
 */

import { listingService } from "../../services/listing.service.js";
import { toastService } from "../../services/toast.service.js";

class AddListingPage {
  constructor() {
    this.form = document.getElementById("listingForm");
    this.map = null;
    this.marker = null;
    this.token = localStorage.getItem("vr_token");
    this.selectedFeatures = new Set();
    this.customFeatures = new Set();
    this.init();
  }

  async init() {
    try {
      await this.loadCategories(); // تحميل الفئات من الـ API
      this.initializeMap();
      this.setupEventListeners();
      this.setupBusinessHours();
    } catch (error) {
      console.error("Error initializing add listing page:", error);
      toastService.error("Failed to initialize page");
    }
  }
  validateForm() {
    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    const requiredFields = [
      "listingName",
      "location",
      "latitude",
      "longitude",
      "mainImage",
      "description",
      "email",
      "mobile",
      "taxNumber",
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === "") {
        toastService.error(`Field ${field} is required`);
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      toastService.error("Invalid email address");
      return false;
    }

    const mobileRegex = /^\d{10,}$/;
    if (!mobileRegex.test(data.mobile)) {
      toastService.error("Invalid mobile number");
      return false;
    }

    const latitude = parseFloat(data.latitude);
    const longitude = parseFloat(data.longitude);
    if (isNaN(latitude) || isNaN(longitude)) {
      toastService.error("Invalid latitude or longitude");
      return false;
    }

    if (!data.mainImage || data.mainImage.trim() === "") {
      toastService.error("Main image is required");
      return false;
    }

    if (!data.description || data.description.trim() === "") {
      toastService.error("Description is required");
      return false;
    }

    // إذا وصلنا إلى هنا، الفورم صحيح
    return true;
  }
  async loadCategories() {
    try {
      // جلب البيانات من الـ API
      const response = await fetch("https://www.vyrlo.com:8080/categories", {
        method: "GET",
        redirect: "follow",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      // تحويل النتيجة إلى JSON
      const categories = await response.json();

      // تعبئة عنصر <select> بالفئات
      this.updateCategorySelect(categories);
    } catch (error) {
      console.error("Error loading categories:", error);
      toastService.error("Failed to load categories");
    }
  }

  updateCategorySelect(categories) {
    const select = document.getElementById("category");
    select.innerHTML = `
            <option value="">Select Category</option>
            ${categories
              .map(
                (cat) => `
                <option value="${cat._id}">${cat.categoryName}</option>
            `
              )
              .join("")}
        `;

    // Update features when category changes
    select.addEventListener("change", (e) => {
      const category = categories.find((c) => c._id === e.target.value);
      if (category) {
        this.updateFeatures(category.amenities);
      }
    });
  }

  setupFeaturesGrid(categories) {
    const container = document.getElementById("featuresContainer");

    // Add event listener for custom features
    const addCustomFeatureBtn = document.getElementById("addCustomFeature");
    const customFeatureInput = document.getElementById("customFeature");

    addCustomFeatureBtn.addEventListener("click", () => {
      const feature = customFeatureInput.value.trim();
      if (feature) {
        this.addCustomFeature(feature);
        customFeatureInput.value = "";
      }
    });
  }

  updateFeatures(features) {
    const container = document.getElementById("featuresContainer");
    container.innerHTML = features
      .map(
        (feature) => `
            <div class="vr-feature-item" data-feature="${feature}">
                <label class="vr-checkbox">
                    <input type="checkbox" value="${feature}">
                    <span>${feature}</span>
                </label>
            </div>
        `
      )
      .join("");

    // Add event listeners to checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          this.selectedFeatures.add(e.target.value);
        } else {
          this.selectedFeatures.delete(e.target.value);
        }
      });
    });
  }

  addCustomFeature(feature) {
    const container = document.getElementById("customFeaturesGrid");
    const featureElement = document.createElement("div");
    featureElement.className = "vr-custom-feature";
    featureElement.innerHTML = `
            <span>${feature}</span>
            <button type="button" class="vr-btn vr-btn--icon">
                <i class="fas fa-times"></i>
            </button>
        `;

    featureElement.querySelector("button").addEventListener("click", () => {
      this.customFeatures.delete(feature);
      featureElement.remove();
    });

    container.appendChild(featureElement);
    this.customFeatures.add(feature);
  }

  initializeMap() {
    // التحقق من وجود حاوية الخريطة
    const mapContainer = document.getElementById("mapContainer");
    if (!mapContainer) return;

    // التحقق ما إذا كانت الخريطة مهيأة بالفعل
    if (this.map) {
      console.log("Map already initialized, updating only");
      this.map.invalidateSize(); // تحديث حجم الخريطة فقط
      return;
    }

    try {
      // إنشاء خريطة جديدة
      this.map = L.map("mapContainer").setView([40.7128, -74.006], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(this.map);

      // إضافة سلوك النقر لتحديد مكان
      this.map.on("click", (e) => {
        if (this.marker) {
          this.map.removeLayer(this.marker);
        }

        this.marker = L.marker(e.latlng).addTo(this.map);
        document.getElementById("latitude").value = e.latlng.lat.toFixed(6);
        document.getElementById("longitude").value = e.latlng.lng.toFixed(6);
      });

      // تحديث الخريطة بعد إظهارها
      setTimeout(() => {
        this.map.invalidateSize();
      }, 500);
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  updateLocation(latlng) {
    this.marker.setLatLng(latlng).addTo(this.map);
    this.map.setView(latlng, 15);

    document.getElementById("latitude").value = latlng.lat.toFixed(6);
    document.getElementById("longitude").value = latlng.lng.toFixed(6);

    this.reverseGeocode(latlng);
  }

  async reverseGeocode(latlng) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latlng.lat}&lon=${latlng.lng}&format=json`
      );
      const data = await response.json();

      if (data.display_name) {
        document.getElementById("address").value = data.display_name;
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  }

  getCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latlng = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.updateLocation(latlng);
        },
        (error) => {
          console.error("Geolocation error:", error);
          toastService.error("Could not get your location");
        }
      );
    } else {
      toastService.error("Geolocation is not supported by your browser");
    }
  }

  setupBusinessHours() {
    const container = document.getElementById("businessHoursContainer");
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    container.innerHTML = days
      .map(
        (day) => `
            <div class="vr-hours-row" data-day="${day}">
                <div class="vr-hours-day">${day}</div>
                <div class="vr-hours-inputs">
                    <select class="vr-input vr-hours-status">
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                    </select>
                    <input type="time" class="vr-input vr-hours-from" value="09:00">
                    <input type="time" class="vr-input vr-hours-to" value="17:00">
                </div>
            </div>
        `
      )
      .join("");

    // Handle 24/7 checkbox
    document.getElementById("is24Hours").addEventListener("change", (e) => {
      const inputs = container.querySelectorAll("input, select");
      inputs.forEach((input) => (input.disabled = e.target.checked));
    });
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!this.validateForm()) {
        return;
      }

      const formData = this.getFormData();

      try {
        await this.submitForm(formData); // استدعاء دالة إرسال البيانات
        toastService.success("Listing created successfully");
        // window.location.href = "/pages/profile.html?section=listings";
      } catch (error) {
        console.error("Error creating listing:", error);
        toastService.error("Failed to create listing");
      }
    });

    // Social media accounts
    document
      .getElementById("addSocialAccount")
      .addEventListener("click", () => {
        this.addSocialMediaField();
      });
  }

  async submitForm(formData) {
    try {
      // إضافة الـ token إلى headers
      const myHeaders = new Headers();
      myHeaders.append("token", this.token);
      myHeaders.append("Content-Type", "application/json");
      //   formData.listingName = `My Listing ${Math.floor(Math.random() * 1000)}`;
      // تحويل formData إلى JSON
      const raw = JSON.stringify(formData);

      // إعداد خيارات الطلب
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      // إرسال الطلب إلى الـ API
      const response = await fetch(
        "https://www.vyrlo.com:8080/listing",
        requestOptions
      );

      // التحقق من أن الاستجابة ناجحة
      if (!response.ok) {
        const errorData = await response.json(); // قراءة رسالة الخطأ من الـ API
        throw new Error(errorData.message || "Network response was not ok");
      }

      const result = await response.json();
      console.log("API Response:", result); // فحص الاستجابة الناجحة

      return result;
    } catch (error) {
      console.error("Error submitting form:", error);
      toastService.error(error.message || "Failed to create listing");
      throw error;
    }
  }

  validateForm() {
    // Add your validation logic here
    return true;
  }

  getFormData() {
    const form = document.getElementById("listingForm");
  
    // جمع البيانات الأساسية
    const businessName = form.querySelector("#businessName").value;
    const category = form.querySelector("#category").value;
    const description = form.querySelector("#description").value;
  
    // جمع بيانات الاتصال
    const email = form.querySelector("#email").value;
    const mobile = form.querySelector("#mobile").value;
    const website = form.querySelector("#website").value;
  
    // جمع بيانات الموقع
    const address = form.querySelector("#address").value;
    const latitude = form.querySelector("#latitude").value;
    const longitude = form.querySelector("#longitude").value;
  
    // جمع بيانات الميزات
    const features = [];
    form.querySelectorAll("#featuresContainer input[type='checkbox']:checked").forEach((checkbox) => {
      features.push(checkbox.value);
    });
  
    // جمع الميزات المخصصة
    const customFeatures = [];
    form.querySelectorAll("#customFeaturesGrid .vr-custom-feature span").forEach((feature) => {
      customFeatures.push(feature.textContent);
    });
  
    // جمع بيانات ساعات العمل
    const businessHours = {};
    const is24Hours = form.querySelector("#is24Hours").checked;
  
    if (is24Hours) {
      // إذا كانت ساعات العمل 24/7
      businessHours.is24Hours = true;
    } else {
      // إذا كانت ساعات العمل محددة
      form.querySelectorAll(".vr-hours-row").forEach((row) => {
        const day = row.dataset.day;
        const status = row.querySelector(".vr-hours-status").value;
        const from = row.querySelector(".vr-hours-from").value;
        const to = row.querySelector(".vr-hours-to").value;
  
        businessHours[day] = {
          status,
          from,
          to,
        };
      });
    }
  
    // جمع بيانات وسائل التواصل الاجتماعي
    const socialMedia = [];
    form.querySelectorAll(".vr-social-account").forEach((account) => {
      const platform = account.querySelector(".vr-social-platform").value;
      const url = account.querySelector('input[type="url"]').value;
  
      if (platform && url) {
        socialMedia.push({ platform, url });
      }
    });
  
    // إرجاع البيانات ككائن
    return {
      listingName: businessName, // Ensure listingName is included
      businessName, // Keep this if needed elsewhere
      category,
      description,
      contact: {
        email,
        mobile,
        website,
      },
      location: address, // Ensure location is a string
      latitude, // Include latitude and longitude separately if needed
      longitude,
      features: {
        standard: features,
        custom: customFeatures,
      },
      businessHours,
      socialMedia,
    };
  }
  addSocialMediaField() {
    const container = document.getElementById("listingSocialMediaContainer");
    const fieldDiv = document.createElement("div");
    fieldDiv.className = "vr-social-account";

    fieldDiv.innerHTML = `
            <select class="vr-input vr-social-platform" name="socialPlatform[]">
                <option value="">Select Platform</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
            </select>
            <input type="url" class="vr-input" name="socialUrl[]" placeholder="Profile URL">
            <button type="button" class="vr-btn vr-btn--icon vr-remove-social">
                <i class="fas fa-times"></i>
            </button>
        `;

    fieldDiv
      .querySelector(".vr-remove-social")
      .addEventListener("click", () => {
        fieldDiv.remove();
      });

    container.appendChild(fieldDiv);
  }

  cleanup() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  new AddListingPage();
});

// تصدير الكلاس
export default AddListingPage;
