=head1 LICENSE

Copyright [1999-2014] Wellcome Trust Sanger Institute and the EMBL-European Bioinformatics Institute

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

=cut

package EnsEMBL::Web::Component::Location::Genoverse;

use strict;

use EnsEMBL::Web::Document::GenoverseImage;

use parent qw(EnsEMBL::Web::Component::Location);

sub _init {
  my $self = shift;
  $self->ajaxable(1);
  $self->configurable(1);
  $self->has_image(1);
}

sub content {
  my $self  = shift;
  my $slice = shift || $self->object->slice;
  my $hub   = $self->hub;
  my $image = $self->new_image($slice, $hub->get_imageconfig($self->view_config->image_config));
  
  return if $self->_export_image($image);
  
  # Temporary message whilst view is still being beta-tested
  return $image->render . $self->_info('Feedback', '
    This view is currently under development and therefore has a limited number of configurable tracks. 
    If you would like to comment on current features or make suggestions, please 
    <a href="http://www.ensembl.org/Help/Contact/?subject=Scrollable Region" class="popup">email us</a>.
  ');
}

# Create a panel to test if Genoverse is supported, and fall back to the standard image if it isn't
# Append Test to the id, so that the real panel can have the correct id which matches that in the configuration panel
sub content_test {
  my $self       = shift;
  my $image_type = $self->hub->session->get_data(type => 'image_type', code => $self->id) || {};
  
  $self->id($self->id . 'Test');
  
  return qq{
    <div class="js_panel">
      <input type="hidden" class="panel_type" value="GenoverseTest" />
      <input type="hidden" class="static_image" value="$image_type->{'static'}" />
    </div>
  };
}

sub new_image {
  my $self       = shift;
  my $hub        = $self->hub;
  my $image_type = $hub->session->get_data(type => 'image_type', code => $self->id) || {};
  
  return $image_type->{'static'} || $hub->param('static') || $hub->param('export') || !(grep $_->[-1] eq 'genoverse', @{$hub->components}) ? $self->SUPER::new_image(@_) : EnsEMBL::Web::Document::GenoverseImage->new({
    hub          => $hub,
    slice        => $_[0],
    image_config => $_[1],
    image_width  => $self->image_width,
    export       => 'iexport',
    export_url   => $self->ajax_url . ';export=',
    component    => $self->id
  });
}

1;
