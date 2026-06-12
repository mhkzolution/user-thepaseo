"use client";

import EventList from "@/components/EventList/page";
import UserProfile from "@/components/UserProfile/page";
import HeaderMobile from "@/components/HeaderMobile/page";

export default function EventPage() {
  return (
    <div className="max-w-2xl mx-auto p-0 px-0 mb-20 md:mt-0 mt-0 md:mb-0 mb-4 rounded-xl">
      <HeaderMobile />

      <div className="md:hidden p-0 pt-8 md:mt-20 -mb-18 rounded-xl">
        <div className="w-full pt-4 pb-0 px-4 md:pt-0 md:px-20 md:pb-0">
          <UserProfile showOn="both" />
        </div>
      </div>

      <div className="w-full bg-white p-4 pt-16 md:p-10 pb-10 md:mt-20 mt-6 pb-10 md:pt-10 rounded-3xl">
        <EventList hideExpired showViewAllLink={false} />
      </div>
    </div>
  );
}
