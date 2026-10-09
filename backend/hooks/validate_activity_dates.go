package hooks

import (
	validation "github.com/pocketbase/ozzo-validation/v4"
	"github.com/pocketbase/pocketbase/core"
)

func ValidateActivityDates(e *core.RecordEvent) error {
	if e.Record.GetString("status") == "planned" && e.Record.GetDateTime("startDate").IsZero() {
		return validation.Errors{
			"startDate": validation.NewError("validation_required", "A planned activity requires a start date."),
		}
	}
	return e.Next()
}
