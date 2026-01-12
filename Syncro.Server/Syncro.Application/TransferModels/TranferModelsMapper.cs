using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Syncro.Application.TransferModels
{
    public static class TranferModelsMapper
    {
        public static AccountNoPasswordModel AccountNoPasswordModelMapMapper(AccountModel account)
        {
            var model = new AccountNoPasswordModel() { nickname = account.nickname};
            
            model.email = account.email;
            model.firstname = account.firstname;
            model.lastname = account.lastname;
            model.phonenumber = account.phonenumber;
            model.avatar = account.avatar;
            
            return model;
        }

        public static AccountWithPersonalInfoNoPasswordModel AccountWithPersonalInfoNoPasswordModelMapper(AccountModel account, PersonalAccountInfoModel personalAccountInfo)
        {
            var model = new AccountWithPersonalInfoNoPasswordModel() { nickname = account.nickname};
            
            model.email = account.email;
            model.firstname = account.firstname;
            model.lastname = account.lastname;
            model.phonenumber = account.phonenumber;
            model.avatar = account.avatar;
            model.country = personalAccountInfo.country;
            
            return model;
        }

        public static AccountWithPersonalInfoNoPasswordModel AccountWithPersonalInfoNoPasswordModelMapper(AccountWithPersonalInfoModel account)
        {
            var model = new AccountWithPersonalInfoNoPasswordModel() { nickname = account.nickname};
            
            model.email = account.email;
            model.firstname = account.firstname;
            model.lastname = account.lastname;
            model.phonenumber = account.phonenumber;
            model.avatar = account.avatar;
            model.country = account.country;
            
            return model;
        }
    }
}