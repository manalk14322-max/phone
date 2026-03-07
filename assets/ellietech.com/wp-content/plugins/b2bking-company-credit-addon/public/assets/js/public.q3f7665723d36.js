/**
*
* JavaScript file that has public action in dokan dashboard
*
*/
(function($){

	"use strict";

	$( document ).ready(function() {

        // Initialize DataTables
        $('#b2bking_company_credit_history_table').dataTable({
            "language": {
                "url": b2bkingcredit_display_settings.datatables_folder+b2bkingcredit_display_settings.credit_history_table_language+'.json'
            },
            "order": [[ 0, "desc" ]]
        });

        // On clicking add credit to cart
        $('#b2bking_reimburse_amount_button').on('click', function(){
            var amountt = $('#b2bking_reimburse_amount_input').val();

            var datavar = {
                action: 'b2bkingaddcredit',
                security: b2bkingcredit_display_settings.security,
                amount: amountt,
            };

            $.post(b2bking_display_settings.ajaxurl, datavar, function(response){
                window.location = b2bking_display_settings.carturl;
            });
        });

        // On clicking redeem coupon
        $('#b2bking_redeem_amount_button').on('click', function(){
            if (confirm(b2bkingcredit_display_settings.sure_redeem_credit)){
                var amountt = $('#b2bking_redeem_amount_input').val();

                if (amountt !== undefined && amountt !== '' && amountt !== 0){
                    var datavar = {
                        action: 'b2bkingredeemcoupon',
                        security: b2bkingcredit_display_settings.security,
                        amount: amountt,
                    };

                    $.post(b2bking_display_settings.ajaxurl, datavar, function(response){
                        location.reload();
                    });
                }

               
            }
        });

        $('#b2bking_redeem_amount_input').on('input', function(){
            let max = parseFloat($(this).attr('max'));
            let min = parseFloat($(this).attr('min'));
            let val = $(this).val();
            if (val > max){
                $(this).val(max);
            }
            if (val < min){
                $(this).val(min);
            }
        });
    });

})(jQuery);