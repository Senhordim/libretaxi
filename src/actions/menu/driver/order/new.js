import Action from '../../../../action';
import CompositeResponse from '../../../../responses/composite-response';
import TextResponse from '../../../../responses/text-response';
import InterruptPromptResponse from '../../../../responses/interrupt-prompt-response';
import RedirectResponse from '../../../../responses/redirect-response';
import MetricDistance from '../../../../decorators/distance/metric-distance';
import GoogleMapsLink from '../../../../decorators/location/google-maps-link';
import InlineOptionsResponse from '../../../../responses/inline-options-response';
import If from '../../../../responses/if-response';
import ZeroPrice from '../../../../conditions/zero-price';

/**
 * Notify driver about new order.
 * Called from outside by {@link NotifyDriversResponseHandler}.
 *
 * @author Roman Pushkin (roman.pushkin@gmail.com)
 * @date 2016-09-30
 * @version 1.1
 * @since 0.1.0
 */
export default class DriverOrderNew extends Action {

  /**
   * Constructor.
   */
  constructor(options) {
    super(Object.assign({ type: 'driver-order-new' }, options));
  }

  /**
   * Notify driver about order the following way:
   * - interrupt current prompt (for CLI only)
   * - show inline buttons (and set callbacks)
   * - show order details
   * - redirect back to `driver-index`
   *
   * @param {object} args - hash of parameters
   * @param {number} args.distance - distance to passenger (in km)
   * @param {Array} args.from - passenger location, for example `[37.421955, -122.084058]`
   * @param {string} args.to - passenger destination (can contain passenger random comments)
   * @param {string} args.passengerKey - passenger key
   * @return {CompositeResponse} - composite response
   */
  call(args) {
    return new CompositeResponse()
      .add(new InterruptPromptResponse())
      .add(new TextResponse({ message: this.t('new_order') }))
      .add(new TextResponse({ message: this.t('distance',
        new MetricDistance(this.i18n, args.distance).toString()) }))
      .add(new TextResponse({ message: this.t('from',
        new GoogleMapsLink(args.from).toString()) }))
      .add(new TextResponse({ message: this.t('to', args.to) }))
      .add(new If({
        condition: new ZeroPrice(args.price),
        ok: new TextResponse({ message: this.t('price_not_set') }),
        err: new TextResponse({ message: this.t('price', args.price) }),
      }))
      .add(new TextResponse({ message: this.t('call_to_action') }))
      .add(new If({
        condition: new ZeroPrice(args.price),
        ok: new InlineOptionsResponse({
          rows: [
            [
              { label: this.t('set_my_price'), value: '2' },
            ],
          ],
        }),
        err: new InlineOptionsResponse({
          rows: [
            [
              {
                label: this.t('send_my_number'),
                value: JSON.stringify({
                  route: 'passenger-contact-new-number',
                  userKey: args.passengerKey,
                  arg: {
                    driverPhone: this.user.state.phone,
                    distance: args.distance,
                  },
                }),
              },
              { label: this.t('set_my_price'), value: '2' },
              { label: this.t('offer_discount'), value: '3' },
            ],
          ],
        }),
      }))
      .add(new RedirectResponse({ path: 'driver-index' }));
  }
}