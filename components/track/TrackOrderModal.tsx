"use client";

import type {
  Order,
} from "@/components/auth/TrackAuthGate";


type Props = {
  order: Order;
  onClose: () => void;
};


/* =========================================================
   STAGES
========================================================= */

const STAGES = [
  "SUBMITTED",
  "CONTACTED",
  "NEGOTIATING",
  "CONFIRMED",
  "READY",
  "SHIPPED",
  "DELIVERED",
];


/* =========================================================
   COMPONENT
========================================================= */

export default function TrackOrderModal({
  order,
  onClose,
}: Props) {

  const status =
    String(
      order.status || ""
    ).toUpperCase();


  const cancelled =
    status === "CANCELLED";


  const currentIndex =
    STAGES.indexOf(status);


  const confirmedIndex =
    STAGES.indexOf(
      "CONFIRMED"
    );


  const showTotal =
    currentIndex >=
    confirmedIndex;


  return (

    <div
      className="track-modal-overlay"
      onClick={onClose}
    >

      <div
        className="track-order-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        {/* =================================================
            MODAL HEADER
        ================================================= */}

        <div className="track-modal-header">

          <div>

            <span>
              Order
            </span>

            <h2>
              {order.quoteNumber}
            </h2>

          </div>


          <button
            type="button"
            className="track-modal-x"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>

        </div>


        {/* =================================================
            CANCELLED
        ================================================= */}

        {cancelled ? (

          <div className="track-cancelled">

            <div className="cancelled-icon">
              !
            </div>

            <h3>
              Sorry, your order has been cancelled.
            </h3>

            <p>
              Please contact SodaSplash if you
              have any questions about this order.
            </p>

          </div>

        ) : (

          <>

            {/* =============================================
                STAGE TRACKER
            ============================================= */}

            <div className="modal-stage-tracker">

              {STAGES.map(
                (
                  stage,
                  index
                ) => {

                  const completed =
                    index <= currentIndex;

                  const current =
                    index === currentIndex;

                  return (

                    <div
                      key={stage}
                      className={`modal-stage ${
                        completed
                          ? "completed"
                          : ""
                      } ${
                        current
                          ? "current"
                          : ""
                      }`}
                    >

                      <div className="modal-stage-top">

                        <div className="modal-stage-circle">

                          {completed
                            ? "✓"
                            : ""}

                        </div>

                        {index <
                          STAGES.length - 1 && (

                          <div
                            className={`modal-stage-line ${
                              index <
                              currentIndex
                                ? "completed"
                                : ""
                            }`}
                          />

                        )}

                      </div>


                      <span>
                        {formatStatus(
                          stage
                        )}
                      </span>

                    </div>

                  );

                }
              )}

            </div>


            {/* =============================================
                CURRENT STAGE
            ============================================= */}

            <div className="modal-current-stage">

              <span>
                Current Stage
              </span>

              <strong>
                {formatStatus(status)}
              </strong>

            </div>


            {/* =============================================
                MAIN INFORMATION
            ============================================= */}

            <div className="modal-order-content">


              {/* ===========================================
                  LEFT - ADDRESS
              =========================================== */}

              <div className="modal-address-section">

                <h3>
                  Delivery Address
                </h3>


                <div className="address-card">

                  {order.address ? (

                    <>
                      <strong>
                        {order.customerName}
                      </strong>

                      <p>
                        {order.address}
                      </p>

                      {order.pincode && (

                        <p>
                          {order.pincode}
                        </p>

                      )}

                    </>

                  ) : (

                    <p>
                      Delivery address not available.
                    </p>

                  )}


                  {order.deliveryDate && (

                    <div className="delivery-date">

                      <span>
                        Expected Delivery
                      </span>

                      <strong>
                        {formatDate(
                          order.deliveryDate
                        )}
                      </strong>

                    </div>

                  )}

                </div>

              </div>


              {/* ===========================================
                  RIGHT - ITEMS
              =========================================== */}

              <div className="modal-items-section">

                <h3>
                  Order Items
                </h3>


                <div className="modal-items-list">

                  {(order.quoteItems || [])
                    .map(
                      (item) => (

                        <div
                          key={item.id}
                          className="modal-item"
                        >

                          <div className="modal-item-name">

                            <strong>
                              {item.flavourName}
                            </strong>

                          </div>


                          <div className="modal-item-quantity">

                            <span>
                              Qty
                            </span>

                            <strong>
                              {item.quantity}
                            </strong>

                          </div>


                          <div className="modal-item-amount">

                            <span>
                              Amount
                            </span>

                            <strong>
                              {formatCurrency(
                                Number(
                                  item.lineTotal || 0
                                )
                              )}
                            </strong>

                          </div>

                        </div>

                      )
                    )}

                </div>


                {/* =========================================
                    TOTAL
                ========================================= */}

                {showTotal &&
                  order.total != null && (

                    <div className="modal-total">

                      <span>
                        Total Amount
                      </span>

                      <strong>
                        {formatCurrency(
                          Number(order.total)
                        )}
                      </strong>

                    </div>

                  )}

              </div>

            </div>


            {/* =============================================
                PAYMENT STATUS
            ============================================= */}

            {showTotal &&
              order.paymentStatus && (

                <div className="modal-payment">

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    {formatStatus(
                      order.paymentStatus
                    )}
                  </strong>

                </div>

              )}

          </>

        )}


        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="modal-back-container">

          <button
            type="button"
            className="modal-back-button"
            onClick={onClose}
          >
            Back to Orders
          </button>

        </div>

      </div>


      {/* ===================================================
          MODAL STYLES
      =================================================== */}

      <style jsx global>{`

        .track-modal-overlay {
          position: fixed;
          inset: 0;

          z-index: 10000;

          display: flex;
          align-items: center;
          justify-content: center;

          padding: 25px;

          background: rgba(2, 13, 19, 0.84);

          backdrop-filter: blur(5px);
        }


        .track-order-modal {
          width: 100%;
          max-width: 1120px;

          max-height: 92vh;

          overflow-y: auto;

          background: #061f2b;

          border: 1px solid #1a4556;

          box-shadow:
            0 25px 80px
            rgba(0, 0, 0, 0.5);

          color: #ffffff;
        }


        /* ===============================================
           HEADER
        =============================================== */

        .track-modal-header {
          display: flex;

          justify-content: space-between;
          align-items: flex-start;

          padding: 26px 30px;

          border-bottom: 1px solid #163d4d;

          background: #072532;
        }


        .track-modal-header > div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }


        .track-modal-header span {
          color: #5f99b1;

          font-size: 11px;

          text-transform: uppercase;

          letter-spacing: 0.12em;
        }


        .track-modal-header h2 {
          margin: 0;

          color: #ffffff;

          font-size: 23px;

          font-weight: 800;
        }


        .track-modal-x {
          width: 38px;
          height: 38px;

          border: 1px solid #1b4c5f;

          background: #092b39;

          color: #b4d0db;

          cursor: pointer;

          font-size: 25px;

          line-height: 1;

          transition: 0.2s;
        }


        .track-modal-x:hover {
          background: #123f50;
          color: #ffffff;
        }


        /* ===============================================
           STAGE TRACKER
        =============================================== */

        .modal-stage-tracker {
          display: flex;

          padding: 30px 35px 25px;

          background: #061f2b;

          overflow-x: auto;
        }


        .modal-stage {
          flex: 1;

          min-width: 95px;

          position: relative;

          text-align: center;
        }


        .modal-stage-top {
          display: flex;

          align-items: center;

          width: 100%;
        }


        .modal-stage-circle {
          position: relative;

          z-index: 2;

          width: 34px;
          height: 34px;

          flex-shrink: 0;

          display: flex;

          align-items: center;
          justify-content: center;

          margin: 0 auto;

          border-radius: 50%;

          border: 2px solid #5c7180;

          background: #0a2936;

          color: #ffffff;

          font-size: 14px;

          font-weight: 800;
        }


        .modal-stage-line {
          position: absolute;

          left: 50%;

          top: 16px;

          width: 100%;

          height: 2px;

          background: #29424d;

          z-index: 1;
        }


        .modal-stage-line.completed {
          background: #21a866;
        }


        .modal-stage.completed
        .modal-stage-circle {
          border-color: #21a866;

          background: #21a866;

          color: #ffffff;
        }


        .modal-stage.current
        .modal-stage-circle {
          border-color: #f17c1a;

          background: #f17c1a;

          box-shadow:
            0 0 0 5px
            rgba(241, 124, 26, 0.13);
        }


        .modal-stage > span {
          display: block;

          margin-top: 11px;

          color: #6e8d9a;

          font-size: 11px;

          font-weight: 600;

          white-space: nowrap;
        }


        .modal-stage.completed > span {
          color: #42bd7c;
        }


        .modal-stage.current > span {
          color: #f58a2c;

          font-weight: 800;
        }


        /* ===============================================
           CURRENT STAGE
        =============================================== */

        .modal-current-stage {
          display: flex;

          align-items: center;

          justify-content: space-between;

          margin: 0 30px;

          padding: 15px 18px;

          border: 1px solid #153e4d;

          background: #072532;
        }


        .modal-current-stage span {
          color: #7195a4;

          font-size: 12px;

          text-transform: uppercase;

          letter-spacing: 0.08em;
        }


        .modal-current-stage strong {
          color: #f28a2d;

          font-size: 14px;
        }


        /* ===============================================
           CONTENT
        =============================================== */

        .modal-order-content {
          display: grid;

          grid-template-columns: 0.9fr 1.4fr;

          gap: 20px;

          padding: 25px 30px;
        }


        .modal-address-section,
        .modal-items-section {
          min-width: 0;
        }


        .modal-address-section h3,
        .modal-items-section h3 {
          margin: 0 0 13px;

          color: #d9ebf1;

          font-size: 15px;
        }


        .address-card {
          min-height: 175px;

          padding: 20px;

          border: 1px solid #173e4d;

          background: #072532;
        }


        .address-card strong {
          color: #ffffff;

          font-size: 15px;
        }


        .address-card p {
          margin: 8px 0;

          color: #8ba8b3;

          font-size: 13px;

          line-height: 1.6;
        }


        .delivery-date {
          display: flex;

          flex-direction: column;

          gap: 4px;

          margin-top: 22px;

          padding-top: 15px;

          border-top: 1px solid #173e4d;
        }


        .delivery-date span {
          color: #628c9c;

          font-size: 11px;

          text-transform: uppercase;

          letter-spacing: 0.08em;
        }


        .delivery-date strong {
          color: #cde4eb;

          font-size: 13px;
        }


        /* ===============================================
           ITEMS
        =============================================== */

        .modal-items-list {
          border: 1px solid #173e4d;

          background: #072532;
        }


        .modal-item {
          display: grid;

          grid-template-columns: 1fr 90px 130px;

          align-items: center;

          gap: 15px;

          min-height: 65px;

          padding: 10px 18px;

          border-bottom: 1px solid #153c4b;
        }


        .modal-item:last-child {
          border-bottom: none;
        }


        .modal-item-name strong {
          color: #e6f2f5;

          font-size: 14px;
        }


        .modal-item-quantity,
        .modal-item-amount {
          display: flex;

          flex-direction: column;

          gap: 3px;
        }


        .modal-item-quantity span,
        .modal-item-amount span {
          color: #608a9b;

          font-size: 10px;

          text-transform: uppercase;

          letter-spacing: 0.07em;
        }


        .modal-item-quantity strong,
        .modal-item-amount strong {
          color: #d8eaf0;

          font-size: 13px;
        }


        .modal-item-amount {
          text-align: right;
        }


        .modal-total {
          display: flex;

          align-items: center;

          justify-content: space-between;

          margin-top: 12px;

          padding: 17px 18px;

          border: 1px solid #1d5668;

          background: #0a3040;
        }


        .modal-total span {
          color: #8eafbb;

          font-size: 13px;

          text-transform: uppercase;

          letter-spacing: 0.06em;
        }


        .modal-total strong {
          color: #ffffff;

          font-size: 20px;
        }


        /* ===============================================
           PAYMENT
        =============================================== */

        .modal-payment {
          display: flex;

          align-items: center;

          justify-content: space-between;

          margin: 0 30px;

          padding: 13px 18px;

          border-top: 1px solid #163d4d;

          color: #7899a6;
        }


        .modal-payment strong {
          color: #53c487;

          font-size: 13px;
        }


        /* ===============================================
           BACK BUTTON
        =============================================== */

        .modal-back-container {
          display: flex;

          justify-content: center;

          padding: 25px 30px 30px;
        }


        .modal-back-button {
          min-width: 180px;

          padding: 12px 25px;

          border: 1px solid #21566b;

          background: #0a2c3c;

          color: #d4eaf1;

          cursor: pointer;

          font-size: 13px;

          font-weight: 700;

          transition: 0.2s;
        }


        .modal-back-button:hover {
          background: #124255;

          border-color: #367991;
        }


        /* ===============================================
           CANCELLED
        =============================================== */

        .track-cancelled {
          padding: 60px 30px;

          text-align: center;
        }


        .cancelled-icon {
          width: 48px;
          height: 48px;

          display: flex;

          align-items: center;
          justify-content: center;

          margin: 0 auto 18px;

          border-radius: 50%;

          background: #54242d;

          color: #ff9da8;

          font-size: 22px;

          font-weight: 800;
        }


        .track-cancelled h3 {
          margin: 0 0 10px;

          color: #ffadb6;

          font-size: 18px;
        }


        .track-cancelled p {
          margin: 0;

          color: #7999a5;

          font-size: 13px;
        }


        /* ===============================================
           MOBILE
        =============================================== */

        @media (max-width: 800px) {

          .track-modal-overlay {
            padding: 10px;
          }


          .track-order-modal {
            max-height: 95vh;
          }


          .modal-stage-tracker {
            padding-left: 20px;
            padding-right: 20px;
          }


          .modal-order-content {
            grid-template-columns: 1fr;

            padding: 20px;
          }


          .modal-current-stage {
            margin: 0 20px;
          }


          .modal-payment {
            margin: 0 20px;
          }


          .modal-item {
            grid-template-columns:
              1fr
              60px
              100px;
          }

        }


        @media (max-width: 550px) {

          .track-modal-header {
            padding: 20px;
          }


          .modal-stage-tracker {
            justify-content: flex-start;
          }


          .modal-stage {
            min-width: 90px;
          }


          .modal-stage > span {
            font-size: 9px;
          }


          .modal-current-stage {
            margin: 0 15px;
          }


          .modal-order-content {
            padding: 18px 15px;
          }


          .modal-item {
            grid-template-columns:
              1fr
              55px
              90px;

            gap: 8px;

            padding: 12px;
          }


          .modal-item-name strong {
            font-size: 12px;
          }


          .modal-item-quantity strong,
          .modal-item-amount strong {
            font-size: 11px;
          }

        }

      `}</style>

    </div>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function formatStatus(
  status: string
) {

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(
      /\b\w/g,
      (char) =>
        char.toUpperCase()
    );

}


function formatDate(
  date?: string | null
) {

  if (!date) {
    return "Not scheduled";
  }


  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

}


function formatCurrency(
  amount: number
) {

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(amount);

}